// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract GuessTheNumber {
  uint8 answer = 42;

  constructor() payable {
    require(msg.value == 1 ether, "Must provide 1 eth");
  }

  function isComplete() public view returns (bool) {
    return address(this).balance == 0;
  }

  function guess(uint8 n) public payable{
    require(msg.value == 1 ether, "Must provide 1 eth");

    if (answer == n) {
      (bool success, ) = payable(msg.sender).call{value: 2 ether}("");
      require(success, "Transfer failed.");
    }
  }
}