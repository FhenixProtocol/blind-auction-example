import { ref } from "vue";
import { ethers } from "ethers";

import type { SupportedProvider } from "fhenixjs";
import { FhenixClient, generatePermit, getPermit, getAllPermits } from "fhenixjs";

import AuctionArtifact from "~/contracts/Auction.json";
import ExampleToken from "~/contracts/FHERC20.json";
import TokenContractDeployment from "~/contracts/FHERC20_DEPLOY.json";
import {
  type Auction,
  type Auction as AuctionContract,
  Auction__factory,
  type ExampleToken as TokenContract,
} from "~/contracts/";


const NO_WINNER = "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF";

type WinningBid = {
  bid: number,
  address: string
};

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
    deployAuctionContract,
    bidEncrypted,
    endAuction,
    getMyBid,
    fnxConnect,
    initFHEClient,
    getFheClient,
    getBalance,
    getProvider,
    getAuctionWinner,
    NO_WINNER
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

async function isAuctionOver() {
  try {
    if (provider !== null && fheClient.value !== null) {
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);

      // todo: this doesn't really exist in the contract
      return await auctionContract.isAuctionOver();
    } else {
      console.error("Error getting auction status: provider or fheClient not found");
      return false;
    }
  } catch (error) {
    console.error("Error getting auction status:", error);
    return false;
  }
}

async function getAuctionWinner(contract: string): Promise<WinningBid | undefined> {
  try {
    if (provider !== null && fheClient.value !== null && address.value !== "") {
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(contract, AuctionArtifact.abi, signer);

      let winner = { bid: 0, address: "", };
      //try { winner.address = await auctionContract.getWinner(); } catch (err) { console.log("IGNORE ->" ,err) };
      try { 
        const winnerResult = await auctionContract.getWinningBid(); 
        winner.bid = winnerResult[0];
        winner.address = winnerResult[1];
      }
        catch (err) { /* console.log("IGNORE ->" ,err)  */
      }
      return winner;
    } else {
      console.error("Error ending auction: provider or fheClient not found");
      return undefined;
    }
  } catch (error) {
    console.error("Error ending auction:", error);
    return undefined;
  }
}

async function endAuction(contract: string) {
  try {
    if (provider !== null && fheClient.value !== null && address.value !== "") {
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(contract, AuctionArtifact.abi, signer);

      return await auctionContract.debugEndAuction();
    } else {
      console.error("Error ending auction: provider or fheClient not found");
    }
  } catch (error) {
    console.error("Error ending auction:", error);
  }
}

async function getMyBid(contract: string): Promise<string> {
  try {

    if (provider !== null && fheClient.value !== null && address.value !== "") {
      const signer = await provider.getSigner();
      const auctionContract = new ethers.Contract(contract, AuctionArtifact.abi, signer);

      let balance = -1;
      const permits = getAllPermits();

      const permit = permits.has(contract) ? await getPermit(contract, provider) : undefined;
      if (permit) {
        balance = await auctionContract.getMyBid(address.value, fheClient.value.extractPermitPermission(permit));
      } else {
        console.log("NO PERMIT");
      }
      return balance.toString();
    } else {
      console.error("Error getting bid: provider or fheClient not found");
      return "0";
    }
  } catch (error) {
    console.error("Error getting token balance:", error);
    return "0";
  }
}

async function mintEncrypted() {
  try {
    if (provider !== null && fheClient.value !== null) {
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);
      const tokenWithSigner = tokenContract.connect(signer) as TokenContract;
      let encryptedAmount = await fheClient.value.encrypt_uint32(100);
      let tx = await tokenWithSigner.mintEncryptedDebug(encryptedAmount);
      console.log(tx);
      await tx.wait();
    }
  } catch (error) {
    console.error("Error minting encrypted:", error);
  }
}

async function deployAuctionContract(dueTime: number): Promise<Auction> {
  let provider = getProvider();
  if (!provider) {
    throw new Error("No provider found");
  }

  const signer = await provider.getSigner();

  const contractFactory = new Auction__factory(AuctionArtifact.abi, AuctionArtifact.bytecode, signer);
  return (await contractFactory.deploy(TokenContractDeployment.address, dueTime)) as Auction;
}

async function bidEncrypted(contract: string, amount: number) {
  let provider = getProvider();
  if (!provider) {
    console.error("No provider found");
    throw new Error("No provider found");
  }

  if (!fheClient.value) {
    console.error("No FHE client found");
    throw new Error("No FHE client found");
  }

  const signer = await provider.getSigner();

  let auctionContract = new ethers.Contract(contract, AuctionArtifact.abi, signer);
  const auctionWithSigner = auctionContract.connect(signer) as AuctionContract;

  const tokenContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);
  const tokenWithSigner = tokenContract.connect(signer) as TokenContract;

  let encryptedAmount = await fheClient.value.encrypt_uint32(amount);

  let tx = await tokenWithSigner.approveEncrypted(contract, encryptedAmount);
  await tx.wait();

  tx = await auctionWithSigner.bid(encryptedAmount);
  await tx.wait();

  // Add permit for this contract so we can query it for our bid later
  let permit = await getPermit(contract, provider);
  fheClient.value.storePermit(permit);
}

async function getTokenBalance() {
  try {
    if (provider !== null && fheClient.value !== null) {
      const tokenAddress = TokenContractDeployment.address;
      const account = address.value;

      console.log(TokenContractDeployment.address);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(TokenContractDeployment.address, ExampleToken.abi, signer);
      const tokenWithSigner = tokenContract.connect(signer) as TokenContract;

      let permit = await getPermit(tokenAddress, provider);
      fheClient.value.storePermit(permit);

      if (!permit) {
        console.error("Error getting permit");
        return "error";
      }

      const balanceSealed = await tokenWithSigner.balanceOfEncrypted(account, fheClient.value.extractPermitPermission(permit));
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
    console.log("chainId", Number(chainId));
    console.log("fnxChainId", Number(fnxChainId));
    if (Number(chainId) !== Number(fnxChainId)) {
      await addFhenixChain();
    }

    mmChainId.value = Number(chainId);
    await switchEthereumChain(Number(fnxChainId));
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
          chainName: "Fhenix Network - Hardhat",
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
    address.value = accounts[0];
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
