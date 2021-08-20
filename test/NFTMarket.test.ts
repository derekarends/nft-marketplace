import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { NFTMarket } from '../typechain/NFTMarket';
import { NFT } from '../typechain/NFT';
import { BigNumber } from 'ethers';

chai.use(solidity);

const { expect } = chai;
const wei = 10 ** 18;

describe('NFTMarket', () => {
  let nftMarket: NFTMarket;
  
  beforeEach(async () => {
    const nftMarketFactory = await ethers.getContractFactory('NFTMarket');
    nftMarket = (await nftMarketFactory.deploy()) as NFTMarket;
    await nftMarket.deployed();
    
    expect(nftMarket.address).to.properAddress;
  });

  describe('GetListingPrice', async () => {
    it('should return the listing price', async () => {
      let listingPrice = await nftMarket.getListingPrice();
      expect(BigNumber.from(listingPrice)).to.eq(ethers.utils.parseUnits((.025 * wei).toString(), 0));
    });
  });

  describe('CreateMarketItem', async () => {
    let nft: NFT;
    let listingPrice: BigNumber;

    beforeEach(async () => {
      const nftFactory = await ethers.getContractFactory('NFT');
      nft = (await nftFactory.deploy(nftMarket.address)) as NFT;
      await nft.deployed();
      expect(nft.address).to.properAddress;

      listingPrice = await nftMarket.getListingPrice();
    });

    it('should require price to be > 0', async () => {
      try {
        await nftMarket.createItem(nft.address, 1, 0, { value: listingPrice });
        expect.fail("The transaction should have thrown an error");
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Price must be larger than 1 wei');
      }
    });

    it('should require msg.value to be listing price', async () => {
      const price = ethers.utils.parseUnits("10", "ether");
      try {
        await nftMarket.createItem(nft.address, 1, price, { value: 0 });
        expect.fail("The transaction should have thrown an error");
      } catch (ex) {
        const err = ex as Error;
        expect(err.message).to.contain('Must send in listing price');
      }
    });
  });
});