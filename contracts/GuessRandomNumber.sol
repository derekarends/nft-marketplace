// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract GuessRandomNumber {
  uint8 answer;

  constructor() payable {
    require(msg.value == 1 ether, "Must send in 1 eth");
    answer = uint8(uint(keccak256(abi.encode(blockhash(block.number - 1)))));
  }

  function isComplete() public view returns (bool) {
    return address(this).balance == 0;
  }

  function guess(uint8 n) public payable {
    require(msg.value == 1 ether, "Must send 1 eth");
    if (n == answer) {
      (bool success, ) = payable(msg.sender).call{value: 2 ether}("");
      require(success, "Failed transfer");
    }
  }
}