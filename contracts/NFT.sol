// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @author Derek Arends
/// @title A simple contract to mint NFTs
contract NFT is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  address contractAddress;

  /// @param marketPlaceAddress is the as address of the market place of this NFT Token
  constructor(address marketPlaceAddress) ERC721("Metaverse Tokens", "METT") {
    contractAddress = marketPlaceAddress;
  }

  /// @notice Create a new NFT Token
  /// @param tokenURI The url of the NFT
  /// @return uint256 as a new tokenId
  function createToken(string memory tokenURI) public returns (uint256) {
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();

    _mint(msg.sender, newItemId);
    _setTokenURI(newItemId, tokenURI);
    setApprovalForAll(contractAddress, true);
    return newItemId;
  }
}