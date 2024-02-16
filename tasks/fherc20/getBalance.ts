import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { ExampleToken } from "../../typechain-types";

task("task:getBalance").setAction(async function (
  _taskArguments: TaskArguments,
  hre,
) {
  const { fhenixjs, ethers, deployments } = hre;
  const [signer] = await ethers.getSigners();

  const erc20 = await deployments.get("ExampleToken");
  const address = await signer.getAddress();
  console.log(`Running getBalance for account ${address}, targeting contract at: ${erc20.address}`);

  const contract = (await ethers.getContractAt(
    "ExampleToken",
      erc20.address,
  )) as unknown as unknown as ExampleToken;

  let permit = await fhenixjs.generatePermit(
      erc20.address,
    undefined, // use the internal provider
    signer,
  );

  console.time("balanceOfEncrypted");
  const sealedResult = await contract.balanceOfEncrypted(address, permit);
  console.timeEnd("balanceOfEncrypted");

  let unsealed = fhenixjs.unseal(erc20.address, sealedResult);

  console.log(`got balance result: ${unsealed.toString()}`);
});
