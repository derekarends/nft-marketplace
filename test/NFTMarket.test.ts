import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFTMarket } from '../typechain/NFTMarket';
import { NFT } from '../typechain/NFT';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);

const { expect } = chai;
const wei = 10 ** 18;
const auctionPrice = ethers.utils.parseUnits('10', 'ether');

describe('NFTMarket', () => {
  let nftMarket: NFTMarket;
  let nft: NFT;
  let listingPrice: BigNumber;

  async function createNft(id: number) {
    await nft.createToken(`https://www.mytokenlocation${id}.com`);
    await nftMarket.createItem(nft.address, id, auctionPrice, { value: listingPrice });
  }
  
  beforeEach(async () => {
    const nftMarketFactory = await ethers.getContractFactory('NFTMarket');
    nftMarket = (await nftMarketFactory.deploy()) as NFTMarket;
    await nftMarket.deployed();
    expect(nftMarket.address).to.properAddress;


    const nftFactory = await ethers.getContractFactory('NFT');
    nft = (await nftFactory.deploy(nftMarket.address)) as NFT;
    await nft.deployed();
    expect(nft.address).to.properAddress;

    listingPrice = await nftMarket.getListingPrice();
  });

  describe('getListingPrice', async () => {
    it('should return the listing price', async () => {
      let listingPrice = await nftMarket.getListingPrice();
      expect(BigNumber.from(listingPrice)).to.eq(ethers.utils.parseUnits((.025 * wei).toString(), 0));
    });
  });

  describe('createMarketItem', async () => {
    it('should require price to be > 0', async () => {
      try {
        await nftMarket.createItem(nft.address, 1, 0, { value: listingPrice });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Price must be larger than 1 wei');
      }
    });

    it('should require msg.value to be listing price', async () => {
      try {
        await nftMarket.createItem(nft.address, 1, auctionPrice, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Must send in listing price');
      }
    });

    it('should emit a market item created', async () => {
      await nft.createToken('https://www.mytokenlocation.com');

      const tx = await nftMarket.createItem(nft.address, 1, auctionPrice, { value: listingPrice });
      
      expect(tx).to.emit(nftMarket, 'MarketItemCreated')
    });
  });

  describe('createMarketSale', async () => {
    let market: SignerWithAddress;
    let seller: SignerWithAddress;
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      market = signers[0]
      seller = signers[1]
      buyer = signers[2];

      await nft.connect(seller).createToken('https://www.mytokenlocation.com');
      await nftMarket.connect(seller).createItem(nft.address, 1, auctionPrice, { value: listingPrice });
    });

    it('should require price to be match item price', async () => {
      try {
        await nftMarket.connect(buyer).createMarketSale(nft.address, 1, { value: 0 });
        expect.fail('The transaction should have thrown an error');
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Please submit asking price for item');
      }
    });

    it('should transfer funds', async () => {
      const tx = await nftMarket.connect(buyer).createMarketSale(nft.address, 1, { value: auctionPrice });
      const sellerProfit = BigNumber.from(auctionPrice).sub(listingPrice);
      const negAuctionPrice = BigNumber.from(auctionPrice).mul(-1);
      expect(tx, 'market balance should have changed by listing price').to.changeEtherBalance(market, listingPrice);
      expect(tx, 'buyer balance should have changed by auction price').to.changeEtherBalance(buyer, negAuctionPrice);
      // expect(tx, 'seller balance should have changed by seller profit').to.changeEtherBalance(seller, sellerProfit);
    });
  });

  describe('fetchUnsoldItems', async () => {
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      buyer = signers[1];
    });

    it('should return an empty array', async () => {
      const items = await nftMarket.fetchUnsoldItems();
      expect(items).to.be.empty;
    });

    it('should return two results', async () => {
      await createNft(1);
      await createNft(2);

      const items = await nftMarket.fetchUnsoldItems();
      expect(items.length).to.be.eq(2);
      for (let i = 0; i < items.length; i++) {
        expect(BigNumber.from(items[i].itemId).toNumber()).to.be.eq(i + 1);
      }
    });

    it('should return one results because there was one sale', async () => {
      await createNft(1);
      await createNft(2);

      await nftMarket.connect(buyer).createMarketSale(nft.address, 1, { value: auctionPrice });

      const items = await nftMarket.fetchUnsoldItems();
      expect(items.length).to.be.eq(1);
      expect(BigNumber.from(items[0].itemId).toNumber()).to.be.eq(2);
    });
  });

  describe('fetchMyNFTs', async () => {
    let buyer: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      buyer = signers[1];
    });

    it('returns and empty array', async () => {
      const items = await nftMarket.fetchMyNFTs();
      expect(items).to.be.empty;
    });

    it('should return one results because buyer bought one', async () => {
      await createNft(1);
      await createNft(2);

      await nftMarket.connect(buyer).createMarketSale(nft.address, 2, { value: auctionPrice });

      const items = await nftMarket.connect(buyer).fetchMyNFTs();
      expect(items.length).to.be.eq(1);
      expect(BigNumber.from(items[0].itemId).toNumber()).to.be.eq(2);
    });
  });

  describe('fetchItemsCreated', async () => {
    let seller: SignerWithAddress;
    beforeEach(async () => {
      const signers = await ethers.getSigners();
      seller = signers[1];
    });

    it('should return an empty array', async () => {
      const items = await nftMarket.fetchItemsCreated();
      expect(items).to.be.empty;
    });

    it('should return two results because seller created two items', async () => {
      await nft.connect(seller).createToken('https://www.mytokenlocation1.com');
      await nftMarket.connect(seller).createItem(nft.address, 1, auctionPrice, { value: listingPrice });

      await nft.connect(seller).createToken('https://www.mytokenlocation2.com');
      await nftMarket.connect(seller).createItem(nft.address, 2, auctionPrice, { value: listingPrice });


      const items = await nftMarket.connect(seller).fetchItemsCreated();
      expect(items.length).to.be.eq(2);
    });
  });
});