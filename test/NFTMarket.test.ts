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
    let buyer: SignerWithAddress;

    beforeEach(async () => {
      const signers = await ethers.getSigners();
      buyer = signers[1];

      await nft.createToken('https://www.mytokenlocation.com');
      await nftMarket.createItem(nft.address, 1, auctionPrice, { value: listingPrice });
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
  });
});