import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { Auction } from "../../typechain-types";

task("task:endAuction")
    .addFlag("debug", "Debugging mode")
    .setAction(async function (taskArguments: TaskArguments, hre) {
        const { ethers, deployments } = hre;
        const [signer] = await ethers.getSigners();

        const auction = await deployments.get("Auction");

        console.log(
            `Running endAuction, targeting contract at: ${auction.address}`,
        );

        const contract = await ethers.getContractAt("Auction", auction.address);

        let contractWithSigner = contract.connect(signer) as unknown as Auction;
        console.time("endAuction");
        try {
            if (taskArguments.debug === true) {
                await contractWithSigner.debugEndAuction();
            } else {
                await contractWithSigner.endAuction();
            }
        } catch (e) {
            console.log(`failed to end auction: ${e}`);
            console.timeEnd("endAuction");
            return;
        }
        console.timeEnd("endAuction");
    });


task("task:getWinner")
    .addFlag("debug", "Debugging mode")
    .setAction(async function (taskArguments: TaskArguments, hre) {
        const { ethers, deployments } = hre;
        const [signer] = await ethers.getSigners();

        const auction = await deployments.get("Auction");

        console.log(
            `Running endAuction, targeting contract at: ${auction.address}`,
        );

        const contract = await ethers.getContractAt("Auction", auction.address);

        let contractWithSigner = contract.connect(signer) as unknown as Auction;
        console.time("endAuction");
        try {
            let winner = await contractWithSigner.getWinner();
            console.log(`winner: ${winner}`);
            let winning_bid = await contractWithSigner.getWinningBid();
            console.log(`winning bid: ${winning_bid.toString()}`);
        } catch (e) {
            console.log(`failed to end auction: ${e}`);
            console.timeEnd("endAuction");
            return;
        }
        console.timeEnd("endAuction");
    });