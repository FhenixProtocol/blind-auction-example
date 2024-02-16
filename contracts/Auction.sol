// SPDX-License-Identifier: BSD-3-Clause-Clear

pragma solidity >=0.8.13 <0.9.0;

import { inEuint32, euint32, FHE } from "@fhenixprotocol/contracts/FHE.sol";
import { IFHERC20 } from "./IFHERC20.sol";
import "./ConfAddress.sol";

struct HistoryEntry {
    euint32 amount;
    bool refunded;
}

contract Auction {
    address payable public auctioneer;
    mapping(address => HistoryEntry) internal auctionHistory;
    euint32 internal CONST_0_ENCRYPTED;
    euint32 internal highestBid;
    Eaddress internal defaultAddress;
    Eaddress internal highestBidder;
    euint32 internal eMaxEuint32;
    uint256 public auctionEndTime;
    IFHERC20 internal _wfhenix;

    // When auction is ended this will contain the PLAINTEXT winner address
    address public winnerAddress;

    event AuctionEnded(address winner, uint32 bid);

    constructor(address wfhenix, uint256 biddingTime) payable {
        _wfhenix = IFHERC20(wfhenix);
        auctioneer = payable(msg.sender);
        auctionEndTime = block.timestamp + biddingTime;
        CONST_0_ENCRYPTED = FHE.asEuint32(0);
        highestBid = CONST_0_ENCRYPTED;
        for (uint i = 0; i < 5; i++) {
            defaultAddress.values[i] = CONST_0_ENCRYPTED;
            highestBidder.values[i] = CONST_0_ENCRYPTED;
        }

        eMaxEuint32 = FHE.asEuint32(0xFFFFFFFF);
    }

    // Modifiers
    modifier onlyAuctioneer() {
        require(msg.sender == auctioneer, "Only auctioneer can perform this action");
        _;
    }

    modifier afterAuctionEnds() {
        require(block.timestamp >= auctionEndTime, "Auction ongoing");
        _;
    }

    modifier auctionNotEnded() {
        require(winnerAddress == address(0), "Auction already ended");
        _;
    }

    modifier auctionEnded() {
        require(winnerAddress != address(0), "Auction already ended");
        _;
    }

    modifier notWinner() {
        require(msg.sender != winnerAddress, "Winner cannot perform this action");
        _;
    }

    function updateHistory(address addr, euint32 currentBid) internal returns (euint32) {
        // Check for overflow, if such, just don't change the actualBid
        // NOTE: overflow is most likely an abnormal action so the funds WON'T be refunded!
        if (!FHE.isInitialized(auctionHistory[addr].amount)) {
            HistoryEntry memory entry;
            entry.amount = currentBid;
            entry.refunded = false;
            auctionHistory[addr] = entry;
            return auctionHistory[addr].amount;
        }

        // Checking overflow here is optional as in real-life precision would be accounted for.
        ebool hadOverflow = (eMaxEuint32 - currentBid).lt(auctionHistory[addr].amount);
        euint32 actualBid = FHE.select(hadOverflow, CONST_0_ENCRYPTED, currentBid);

        // Add the actual bid to the previous bid
        // If there was no bid it will work because the default value of uint32 is encrypted 02
        auctionHistory[addr].amount = auctionHistory[addr].amount + actualBid;
        return auctionHistory[addr].amount;
    }

    function bid(inEuint32 calldata amount)
    external
    auctionNotEnded
    {

        euint32 spent = _wfhenix.transferFromEncrypted(msg.sender, address(this), amount);

        euint32 newBid = updateHistory(msg.sender, spent);
        // Can't update here highestBid directly because we need and indication whether the highestBid was changed
        // if we will change here the highestBid
        // we will have an edge case when the current bid will be equal to the highestBid
        euint32 newHeighestBid = FHE.max(newBid, highestBid);

        Eaddress memory eaddr = ConfAddress.toEaddress(payable(msg.sender));
        ebool wasBidChanged = newHeighestBid.gt(highestBid);

        highestBidder = ConfAddress.conditionalUpdate(wasBidChanged, highestBidder, eaddr);
        highestBid = newHeighestBid;
    }

    function getWinner()
    external
    view
    auctionEnded
    returns (address) {
        return winnerAddress;
    }

    function getWinningBid()
    external
    view
    auctionEnded
    returns (uint256) {
        return FHE.decrypt(highestBid);
    }

    function endAuction()
    external
    onlyAuctioneer
    afterAuctionEnds
    auctionNotEnded
    {
        winnerAddress = ConfAddress.unsafeToAddress(highestBidder);
        // The cards can be revealed now, we can safely reveal the bidder
        emit AuctionEnded(winnerAddress, FHE.decrypt(highestBid));
    }

    // just for debugging purposes
    function debugEndAuction()
    public
    onlyAuctioneer
    auctionNotEnded
    {
        winnerAddress = ConfAddress.unsafeToAddress(highestBidder);
        // The cards can be revealed now, we can safely reveal the bidder
        emit AuctionEnded(winnerAddress, FHE.decrypt(highestBid));
    }

    function redeemFunds()
    external
    notWinner
    auctionEnded
    {
        require(!auctionHistory[msg.sender].refunded, "Already refunded");

        euint32 toBeRedeemed = auctionHistory[msg.sender].amount;

        auctionHistory[msg.sender].refunded = true;

        _wfhenix.transferEncrypted(msg.sender, toBeRedeemed);
    }
}
