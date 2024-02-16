// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./FHERC20.sol";
import { FHE, euint32, inEuint32 } from "@fhenixprotocol/contracts/FHE.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

contract ExampleToken is FHERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol, uint256 initialBalance, inEuint32 memory encryptedBalance) FHERC20(name, symbol) {
        _mint(msg.sender, initialBalance);
        _mintEncrypted(msg.sender, encryptedBalance);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mintEncrypted(address recipient, inEuint32 memory amount) public {
        if (hasRole(MINTER_ROLE, msg.sender)) {
            _mintEncrypted(recipient, amount);
        }
    }
}
