import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { FHERC20 } from "../../typechain-types";

task("task:bid")
  .addParam("amount", "Amount to transfer (plaintext number)", "1")
  .setAction(async function (taskArguments: TaskArguments, hre) {
      const { fhenixjs, ethers, deployments } = hre;
      const [signer] = await ethers.getSigners();
      let signerAddress = await signer.getAddress();
      const amountToBid = Number(taskArguments.amount);


      const fherc20 = await deployments.get("FHERC20");
      const tokenContract = await ethers.getContractAt("FHERC20", fherc20.address);

      const auction = await deployments.get("Auction");
      const auctionContract = await ethers.getContractAt("Auction", auction.address);

      const encryptedAmount = await fhenixjs.encrypt_uint32(amountToBid);

      let contractWithSigner = tokenContract.connect(signer) as unknown as FHERC20;

      console.log(`setting allowance on token contract: ${fherc20.address} for auction contract at: ${fherc20.address}`);

      console.time("allowanceDuration");
      try {
          await contractWithSigner.approveEncrypted(auction.address, encryptedAmount);
      } catch (e) {
          console.log(`failed to set allowance: ${e}`);
          console.timeEnd("allowanceDuration");
          return;
      }
      console.timeEnd("allowanceDuration");

      console.log(`minting ${amountToBid}`)
      await hre.run("task:mint", {amount: String(amountToBid)})

      console.log(`bidding @ auction contract at: ${fherc20.address}, amount: ${amountToBid}`);
      console.time("bidDuration");
      try {
          await auctionContract.bid(encryptedAmount);
      } catch (e) {
          console.log(`failed to bid: ${e}`);
          console.timeEnd("bidDuration");
          return;
      }
      console.timeEnd("bidDuration");


  });
