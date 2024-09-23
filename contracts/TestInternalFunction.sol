// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TestContract.sol";
contract TestInternalFunction is TestContract{

    // Internal function using a library
    function calculate(uint256 a, uint256 b) public pure returns (uint256) {
        return _calculate(a, b);
    }

    // Private function (example, not callable from other contracts)
    function privateFunction() public pure returns (string memory) {
        return "This is a private function";
    }
}