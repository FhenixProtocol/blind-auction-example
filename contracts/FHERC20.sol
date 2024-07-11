// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { FHERC20 } from "@fhenixprotocol/contracts/experimental/token/FHERC20/FHERC20.sol";
import { FHE, euint128, inEuint128 } from "@fhenixprotocol/contracts/FHE.sol";

contract ExampleToken is FHERC20 {
      constructor(string memory name, string memory symbol)
        FHERC20(
            bytes(name).length == 0 ? "FHE Token" : name,
            bytes(symbol).length == 0 ? "FHE" : symbol
        ) {}

        function mint(uint256 amount) public {
            _mint(msg.sender, amount);
        }

        function mintEncrypted(inEuint128 calldata encryptedAmount) public {
            euint128 amount = FHE.asEuint128(encryptedAmount);
            if (!FHE.isInitialized(_encBalances[msg.sender])) {
                _encBalances[msg.sender] = amount;
            } else {
                _encBalances[msg.sender] = _encBalances[msg.sender] + amount;
            }

            totalEncryptedSupply = totalEncryptedSupply + amount;
        }        
}