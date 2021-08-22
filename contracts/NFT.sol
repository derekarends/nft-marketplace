// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @author Derek Arends
 * @title A simple contract to mint NFTs
 * @dev This will create a contract specific to the maket place
 * and create a token to associate the uri with the sender
 */
contract NFT is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  address private _contractAddress;

  /**
   * @param marketPlaceAddress is the as address of the market place of this NFT Token
   */
  constructor(address marketPlaceAddress) ERC721("Thinkovator Tokens", "THINK") {
    _contractAddress = marketPlaceAddress;
  }

  /**
   * Create a new NFT Token
   * @param tokenURI The url of the NFT
   * @return uint256 as a new tokenId
   */
  function createToken(string memory tokenURI) public returns (uint256) {
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();

    _safeMint(msg.sender, newItemId);
    _setTokenURI(newItemId, tokenURI);
    setApprovalForAll(_contractAddress, true);

    return newItemId;
  }
}