import { ref } from "vue";
import { ethers } from "ethers";

import { FhenixClient, generatePermit } from "fhenixjs";
import type { SupportedProvider } from "fhenixjs";

import AuctionArtifact from "~/contracts/Auction.json";
import ExampleToken from "~/contracts/FHERC20.json";
import TokenContractDeployment from "~/contracts/FHERC20_DEPLOY.json";
import { type ExampleToken as TokenContract } from "../../typechain-types";

type ExtendedProvider = SupportedProvider & {
  getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt>;
  send(method: string, params: any[] | Record<string, any>): Promise<any>;
  getSigner(): Promise<any>;
  getBalance(address: string): Promise<any>;
};

const config = useRuntimeConfig();

const ERROR_CHAIN_DOES_NOT_EXIST = 4902;

let provider = null as ExtendedProvider | ethers.BrowserProvider | null;
const fheClient = ref<FhenixClient | null>(null);
const fnxChainId = config.public.NETWORK_CHAIN_ID;
const networkRPC = config.public.NETWORK_RPC_URL;
const explorerURL = config.public.NETWORK_EXPLORER_URL;
const mmChainId = ref<number>(-1);
const isItFhenixNetwork = ref<boolean>(false);
const eventWasAdded = ref<boolean>(false);
const balance = ref<string>("");
const address = ref<string>("");
const tokenAddress = ref<string>(TokenContractDeployment.address);

export default function useChain() {
  return {
    isItFhenixNetwork,
    balance,
    address,
    tokenAddress,
    mintEncrypted,
    getTokenBalance,
    fnxConnect,
    initFHEClient,
    getFheClient,
    getBalance,
    getProvider,
  };
}

function getProvider() {
  if (provider === null) {
    // @ts-ignore
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  return provider;
}

function initFHEClient() {
  fheClient.value = new FhenixClient({ provider: provider as SupportedProvider });
}

function getFheClient() {
  return fheClient.value;
}

async function mintEncrypted() {
  try {
    if (provider !== null && fheClient.value !== null) {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);
      const tokenWithSigner = tokenContract.connect(signer) as TokenContract;

      let encryptedAmount = await fheClient.value.encrypt_uint32(10);

      let tx = await tokenWithSigner.mintEncryptedDebug(encryptedAmount);
      await tx.wait();
    }
  } catch (error) {
    console.error("Error minting encrypted:", error);
  }
}

async function getTokenBalance() {
  try {
    if (provider !== null && fheClient.value !== null) {
      const tokenAddress = TokenContractDeployment.address;
      const account = address.value;

      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);
      const tokenWithSigner = tokenContract.connect(signer) as TokenContract;

      let permit = fheClient.value.getPermit(tokenAddress);

      if (!permit) {
        try {
          permit = await generatePermit(tokenAddress, provider, signer);
          fheClient.value.storePermit(permit);
        } catch (e) {
          console.error("Error generating permit:", e);
        }
      }

      if (!permit) {
        console.error("Error getting permit");
        return "error";
      }

      const balanceSealed = await tokenWithSigner.balanceOfEncrypted(account, permit);

      const balance = fheClient.value.unseal(tokenAddress, balanceSealed);

      console.log(`Balance: ${balance.toString()}`);

      return balance.toString();
    }
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "-1";
  }
}

async function fnxConnect() {
  try {
    if (provider === null) {
      // @ts-ignore
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    if (provider === null) return;

    const chainId = await provider.send("eth_chainId", []);
    if (Number(chainId) !== Number(fnxChainId)) {
      await addFhenixChain();
    }
    mmChainId.value = Number(chainId);
    await switchEthereumChain(Number(chainId));
    if (!eventWasAdded.value) {
      eventWasAdded.value = true;
      setupMetaMaskListeners();
    }
    localStorage.setItem("isConnected", "1");
    balance.value = await getBalance();
    initFHEClient();
  } catch (err) {
    console.error("Error:", err);
  }
}

async function addFhenixChain() {
  try {
    if (provider !== null) {
      const chainData = [
        {
          chainId: "0x" + Number(fnxChainId).toString(16),
          chainName: "Fhenix Network",
          nativeCurrency: { name: "FHE Token", symbol: "FHE", decimals: 18 },
          rpcUrls: [networkRPC],
          blockExplorerUrls: [explorerURL],
        },
      ];
      await provider.send("wallet_addEthereumChain", chainData);
      console.log("Custom network added");
    }
  } catch (addError) {
    console.error("Error adding custom network:", addError);
  }
}

async function switchEthereumChain(chainId: number) {
  try {
    if (!provider) {
      return;
    }

    await provider.send("wallet_switchEthereumChain", [{ chainId: "0x" + chainId.toString(16) }]);
    console.log("Switched to network:", chainId);
    isItFhenixNetwork.value = Number(chainId) === Number(fnxChainId);
  } catch (switchError: unknown) {
    console.error("Error switching networks:", switchError);
    if (switchError instanceof Error) {
      const errorDetails = (switchError as any).error; // Using any to access nested properties

      if (errorDetails && errorDetails.code === ERROR_CHAIN_DOES_NOT_EXIST) {
        addFhenixChain();
      }
    }
  }
}

async function setupMetaMaskListeners() {
  // @ts-ignore
  window.ethereum.on("accountsChanged", async (accounts: string[]) => {
    console.log("Account changed:", accounts[0]);
    // @ts-ignore
    provider = new ethers.BrowserProvider(window.ethereum);
  });

  // Listen for chain changes
  // @ts-ignore
  window.ethereum.on("chainChanged", async (chainId: number) => {
    console.log("Network changed to:", chainId);
    mmChainId.value = Number(chainId);
    // @ts-ignore
    provider = new ethers.BrowserProvider(window.ethereum);
    isItFhenixNetwork.value = Number(chainId) === Number(fnxChainId);
  });
}

async function getBalance(): Promise<string> {
  try {
    var returnBalance = "0";
    if (provider !== null) {
      const signer = await provider.getSigner();
      address.value = await signer.getAddress();
      const balance = await provider.getBalance(address.value);

      if (balance) {
        returnBalance = `${Number(ethers.formatEther(balance))} ETH`;
      }
      console.log(`Balance: ${returnBalance}`);
    }
    return returnBalance;
  } catch (error) {
    console.error("Error getting balance:", error);
    return "-1";
  }
}
