// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract GuessSecretNumber {
  bytes32 answerHash = 0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365;

  constructor() payable {
    require(msg.value == 1 ether, "Must create with 1 ether");
  }

  function isComplete() public view returns (bool) {
    return address(this).balance == 0;
  }

  function guess(uint8 n) public payable {
    require(msg.value == 1 ether, "Requires 1 eth");
    if (keccak256(abi.encodePacked((n))) == answerHash) {
      (bool success, ) = payable(msg.sender).call{value: 2 ether}("");
      require(success, "Transfer failed.");
    }
  }
}