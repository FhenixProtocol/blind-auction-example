import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Auction, ExampleToken } from "../../typechain-types";
import { FhenixClient } from "fhenixjs"

async function getMyBid(contract, contractAddress, signer, fhenixjs) {
  const permit = await fhenixjs.generatePermit(contractAddress, undefined, signer);
  const mBid = await contract.getMyBid(signer.address, fhenixjs.extractPermitPermission(permit));
  return mBid;
}

async function getTokenBalance(contract, contractAddress, signer, fhenixjs) {
  const permit = await fhenixjs.generatePermit(contractAddress, undefined, signer);
  const sealedResult = await contract.balanceOfEncrypted(signer.address, fhenixjs.extractPermitPermission(permit));
  return fhenixjs.unseal(contractAddress, sealedResult);
}

task("task:simulate").addFlag("debug", "Debugging mode")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    console.log("debug mode:", taskArguments.debug);
    const { ethers, deployments} = hre;
    const fhenixjs: FhenixClient = hre.fhenixjs;

    const [signer, buyer] = await ethers.getSigners();

    if ((await ethers.provider.getBalance(signer.address)) < ethers.parseEther("1.0")) {
      await fhenixjs.getFunds(signer.address).then(() => console.log("funded", signer.address));
    }
    if ((await ethers.provider.getBalance(buyer.address)) < ethers.parseEther("1.0")) {
      await fhenixjs.getFunds(buyer.address).then(() => console.log("funded", buyer.address));
    }

    const { deploy } = deployments;

    console.log("deploying fherc20");
    let encrypted_mint = await fhenixjs.encrypt(10000000);
    const token = await deploy("ExampleToken", {
      from: signer.address,
      args: ["token", "FHE", 10000000, encrypted_mint],
      log: true,
      skipIfAlreadyDeployed: true,
    });
    console.log(`fherc20 contract:`, token.address);

    const tokenContract = await ethers.getContractAt("ExampleToken", token.address);
    let tokenWithSigner = tokenContract.connect(signer) as ExampleToken;
    let tokenWithBuyer = tokenContract.connect(buyer) as ExampleToken;

    let buyerBalance;
    buyerBalance = await getTokenBalance(tokenWithBuyer, token.address, buyer, fhenixjs);
    console.log("buyer token balance:", buyerBalance);

    await getTokenBalance(tokenWithSigner, token.address, signer, fhenixjs).then(b => console.log("seller token balance:", b));

    if (buyerBalance < 100) {
      console.log("minting tokens for buyer");
      encrypted_mint = await fhenixjs.encrypt_uint32(101);
      await tokenWithSigner.mintEncrypted(buyer.address, encrypted_mint);
      console.log("minted!");
    } else {
      console.log("buyer has enough funds");
    }

    const auctionDurationSeconds = 6;
    await deployments.delete("Auction");
    const auction = await deploy("Auction", {
      from: signer.address,
      args: [token.address, auctionDurationSeconds],
      log: true,
      skipIfAlreadyDeployed: false,
    });
    console.log(`Auction contract:`, auction.address);
    const sleep = new Promise(r => setTimeout(r, (2 + auctionDurationSeconds) * 1000));

    const auctionContract = await ethers.getContractAt("Auction", auction.address);
    let auctionWithBuyer = auctionContract.connect(buyer) as Auction;
    let auctionWithSinger = auctionContract.connect(signer) as Auction;
    const encrypted_bid = await fhenixjs.encrypt_uint32(22);

    const approve = tokenWithBuyer.approveEncrypted(auction.address, encrypted_bid);

    await Promise.all([
      sleep.then(() => console.log("auction ended")),
      approve.then(() => {
        console.log("approved encrypted amount in token for the buyer");
        return auctionWithBuyer.bid(encrypted_bid).then(() => console.log("bid successfully entered"))
      }).then(async () => {
        const myBid = await getMyBid(auctionWithBuyer, auction.address, buyer, fhenixjs);
        console.log("buyers bid in contract:", myBid);
      })
    ])

    const sellerBalanceBefore = await getTokenBalance(tokenWithSigner, token.address, signer, fhenixjs);
    console.log("seller balance before:", sellerBalanceBefore);
    console.log("finalizing auction");
    let receipt;
    try {
      let tx;
      if (taskArguments.debug === true) {
        tx = await auctionWithSinger.debugEndAuction();
      } else {
        tx = await auctionWithSinger.endAuction();
      }
      receipt = await tx.wait();
    } catch (e) {
      console.log(`failed to finalize auction: ${e}`);
      return;
    }

    const winnerEvent = receipt.logs[0].args;
    console.log("winner:", winnerEvent[0] + ",", "bid:", winnerEvent[1]);

    const sellerBalanceAfter = await getTokenBalance(tokenWithSigner, token.address, signer, fhenixjs);
    console.log("seller balance after:", sellerBalanceAfter);
    console.log("therefore, sent to seller:", sellerBalanceAfter - sellerBalanceBefore);
  }
);