import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { PublicToken } from "../../typechain-types";

task("task:transferPublic")
  .addParam("amount", "Amount to transfer (plaintext number)", "1")
  .addOptionalParam("to", "Destination address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { fhenixjs, ethers, deployments } = hre;
    const [signer] = await ethers.getSigners();

    let signerAddress = await signer.getAddress();
    const amountToAdd = Number(taskArguments.amount);

    let destinationAddress = taskArguments?.to || signerAddress;

    const fherc20 = await deployments.get("PublicToken");

    console.log(
      `Running addCount(${amountToAdd}), targeting contract at: ${fherc20.address}`,
    );

    const contract = await ethers.getContractAt("PublicToken", "0x797f6998f40d3032D228b08cc9ADDaEA921c51D4");


    let contractWithSigner = contract.connect(signer) as unknown as PublicToken;

      console.time("transferDuration");

      try {
          await contractWithSigner.transfer(destinationAddress, 3);
      } catch (e) {
          console.log(`failed to transfer balance: ${e}`);
          return;
      }

      console.timeEnd("transferDuration");

  });
