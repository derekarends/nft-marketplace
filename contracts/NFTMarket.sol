// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @author Derek Arends
 * @title A contract to manage NFTs
 */
contract NFTMarket is ReentrancyGuard {
  using Counters for Counters.Counter;
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;
  address payable private _owner;
  uint256 private _listingPrice = 0.025 ether;

  /**
   * The item for sale in the market place
   */
  struct MarketItem {
    uint256 itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
  }

  /**
   * Then event emitted when an item is listed for sale
   */
  event MarketItemCreated (
    uint256 indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price,
    bool sold
  );

  /**
   * Mapping between itemId => marketItem
   */
  mapping(uint256 => MarketItem) private _itemIdToMarketItem;

  /**
   * Construct the smart contract
   */
  constructor() {
    _owner = payable(msg.sender);
  }

  /**
   * Gets the listing price for this market place
   * @return int256 as the market place listing price
   */
  function getListingPrice() public view returns (uint256) {
    return _listingPrice;
  }

  /**
   * Creates the market item
   * @dev Will emit the MarketItemCreated event and required eth
   * @param nftContract The Address of the nft
   * @param tokenId The token id
   * @param price The current price of the nft
   */
   function createItem(
     address nftContract,
     uint256 tokenId,
     uint256 price
     ) public payable nonReentrant {
      require(price > 0, "Price must be larger than 1 wei");
      require(msg.value == _listingPrice, "Must send in listing price");

      _itemIds.increment();
      uint256 itemId = _itemIds.current();

      _itemIdToMarketItem[itemId] = MarketItem(
        itemId,
        nftContract,
        tokenId,
        payable(msg.sender),
        payable(address(0)),
        price,
        false
      );

      // TODO: Should be safeTransferFrom
      IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

      emit MarketItemCreated(
        itemId,
        nftContract,
        tokenId,
        msg.sender,
        address(0),
        price,
        false
      );
   }

  /// Used to purchase an item
  /// @param nftContract Address of nft contract
  /// @param itemId Item to buy
  function createMarketSale(
    address nftContract,
    uint256 itemId
  ) public payable nonReentrant {
    require(msg.value == _itemIdToMarketItem[itemId].price, "Please submit asking price for item");

    // _itemIdToMarketItem[itemId].seller.transfer(msg.value);
    (bool sellerTransferSuccess, ) = _itemIdToMarketItem[itemId].seller.call{value: msg.value}("");
    require(sellerTransferSuccess, "Seller profits transfer failed.");

    // TODO: Should be safeTransferFrom
    IERC721(nftContract).transferFrom(address(this), msg.sender, _itemIdToMarketItem[itemId].tokenId);
    _itemIdToMarketItem[itemId].owner = payable(msg.sender);
    _itemIdToMarketItem[itemId].sold = true;
    _itemsSold.increment();

    // payable(_owner).transfer(_listingPrice);
    (bool ownerTransferSuccess, ) = payable(_owner).call{value: _listingPrice}("");
    require(ownerTransferSuccess, "Listing price transfer failed.");
  }

  /// Fetch all market place items that are for sale
  /// @return MarketItem[] of all market place items that are for sale
  function fetchUnsoldItems() public view returns(MarketItem[] memory) {
    uint256 itemCount = _itemIds.current();
    uint256 unsoldItemsCount = itemCount - _itemsSold.current();
    uint256 currentIndex = 0;

    MarketItem[] memory unsoldItems = new MarketItem[](unsoldItemsCount);

    for(uint256 i = 1; i <= itemCount; i++) {
      if (_itemIdToMarketItem[i].owner == address(0)) {
        unsoldItems[currentIndex] = _itemIdToMarketItem[i];
        currentIndex += 1;
      }
    }

    return unsoldItems;
  }

  /**
    * Fetch the NFT's the user has purchased
    * @return MarketItem[] of all the users purchased NFTs
    */
  function fetchMyNFTs() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 myItemsCount = 0;
    uint256 currentIndex = 0;

    for(uint256 i = 1; i <= totalItemCount; i++) {
      if (_itemIdToMarketItem[i].owner == msg.sender) {
        myItemsCount += 1;
      }
    }
    
    MarketItem[] memory myNfts = new MarketItem[] (myItemsCount);

    for(uint256 i = 1; i <= totalItemCount; i++) {
      if (_itemIdToMarketItem[i].owner == msg.sender) {
        myNfts[currentIndex] = _itemIdToMarketItem[i];
        currentIndex += 1;
      }
    }

    return myNfts;
  }
  
  /**
   * Get the items the seller has created
   * @return MarketItem[] of the items the seller has created
   */
  function fetchItemsCreated() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemsCount = 0;
    uint256 currentIndex = 0;

    for (uint256 i = 1; i <= totalItemCount; i++) {
      if (_itemIdToMarketItem[i].seller == msg.sender) {
        itemsCount += 1;
      }
    }

    MarketItem[] memory itemsCreated = new MarketItem[] (itemsCount);

    for (uint256 i = 1; i <= totalItemCount; i++) {
      if (_itemIdToMarketItem[i].seller == msg.sender) {
        itemsCreated[currentIndex] = _itemIdToMarketItem[i];
        currentIndex += 1;
      }
    }

    return itemsCreated;
  }
} 