// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { FHERC20 } from "@fhenixprotocol/contracts/experimental/token/FHERC20/FHERC20.sol";
import { FHE, euint32, inEuint32 } from "@fhenixprotocol/contracts/FHE.sol";

contract ExampleToken is FHERC20 {
      uint factor = (10 ** 12);
      bool _autoWrap = true;
      address public contractOwner;

      constructor(string memory name, string memory symbol)
        FHERC20(
            bytes(name).length == 0 ? "FHE Token" : name,
            bytes(symbol).length == 0 ? "FHE" : symbol
        ) {
            contractOwner = msg.sender;
        }

        function mint(uint256 amount) public {
            _mint(msg.sender, amount);
        }

        function mintEncrypted(inEuint32 calldata encryptedAmount) public {
            euint32 amount = FHE.asEuint32(encryptedAmount);
            if (!FHE.isInitialized(_encBalances[msg.sender])) {
                _encBalances[msg.sender] = amount;
            } else {
                _encBalances[msg.sender] = _encBalances[msg.sender] + amount;
            }

            totalEncryptedSupply = totalEncryptedSupply + amount;
        }

        modifier onlyContractOwner() {
            require(msg.sender == contractOwner);
            _;
        }        


        function enableAutoWrapping() public onlyContractOwner {
            _autoWrap = true;
        }

        function diableAutoWrapping() public onlyContractOwner {
            _autoWrap = false;
        }

        receive() external payable {
              require(msg.value > 0, string(abi.encodePacked("Send ", symbol()," to buy tokens"))); 
              uint256 actualAmount = msg.value / factor;
              _mint(msg.sender, uint32(actualAmount));
              if (_autoWrap) {
                  wrap(uint32(actualAmount));
              }
          }

          function withdraw(uint32 tokenAmount) public {
              _burn(msg.sender, tokenAmount);
              uint256 actualAmount = tokenAmount * factor;
              payable(msg.sender).transfer(actualAmount);
          }        
}