import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { ExampleToken } from "../../typechain-types";

task("task:mint")
  .addParam("amount", "Amount to transfer (plaintext number)", "1")
  .addOptionalParam("to", "Destination address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhenixjs, ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    let signerAddress = await signer.getAddress();
    const amountToAdd = Number(taskArguments.amount);

    let destinationAddress = taskArguments?.to || signerAddress;

    const Counter = await deployments.get("ExampleToken");

    console.log(
      `Running mint(${amountToAdd}), targeting contract at: ${Counter.address}`,
    );
    console.log(`
      Running with account ${signerAddress}
    `)

    const contract = await ethers.getContractAt("ExampleToken", Counter.address);

    const encryptedAmount = await fhenixjs.encrypt_uint32(amountToAdd);

    let contractWithSigner = contract.connect(signer) as unknown as ExampleToken;

      console.time("mintEncrypted");
      try {
      await contractWithSigner.mintEncrypted(destinationAddress, encryptedAmount);
    } catch (e) {
      console.log(`mint failed: ${e}`);
      return;
    }
      console.timeEnd("mintEncrypted");
      console.log(`Done mint`);
  });
