import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { fhenixjs, ethers } = hre;
  const { deploy } = hre.deployments;
  const [signer] = await ethers.getSigners();

  if (hre.network.name === "localfhenix") {
    if (await signer.getBalance() < ethers.utils.parseEther("1.0")) {
      await fhenixjs.getFunds(signer.address);
    }
  }

  let encrypted_mint = await fhenixjs.encrypt(10000000);

  const token = await deploy("ExampleToken", {
    from: signer.address,
    args: ["token", "FHE", 10000000, encrypted_mint],
    log: true,
    skipIfAlreadyDeployed: true,
  });

  console.log(`auction fherc20 contract: `, token.address);

  const voting = await deploy("Auction", {
    from: signer.address,
    args: [token.address, 3600],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log(`Auction contract: `, voting.address);
};

export default func;
func.id = "deploy_auction";
func.tags = ["Auction", "FHERC20-Auction"];
