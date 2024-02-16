import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FHERC20 } from "../../typechain-types";

task("task:transfer")
  .addParam("amount", "Amount to transfer (plaintext number)", "1")
  .addOptionalParam("to", "Destination address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhenixjs, ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    let signerAddress = await signer.getAddress();
    const amountToAdd = Number(taskArguments.amount);

    let destinationAddress = taskArguments?.to || signerAddress;

    const fherc20 = await deployments.get("ExampleToken");

    console.log(
      `Running addCount(${amountToAdd}), targeting contract at: ${fherc20.address}`,
    );

    const contract = await ethers.getContractAt("ExampleToken", fherc20.address);

    const encryptedAmount = await fhenixjs.encrypt_uint32(amountToAdd);

    let contractWithSigner = contract.connect(signer) as unknown as FHERC20;

      console.time("transferEncryptedDuration");

      try {
          await contractWithSigner["transferEncrypted(address,(bytes))"](destinationAddress, encryptedAmount);
      } catch (e) {
          console.log(`failed to transfer balance: ${e}`);
          console.timeEnd("failed transferEncryptedDuration");
          return;
      }

      console.timeEnd("transferEncryptedDuration");

  });
