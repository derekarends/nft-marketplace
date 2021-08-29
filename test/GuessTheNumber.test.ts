import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { GuessTheNumber } from '../typechain/GuessTheNumber';
import { utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);
const contractName = 'GuessTheNumber';
const { expect } = chai;

describe(`${contractName}`, () => {
  let signers: SignerWithAddress[];
  let gtn: GuessTheNumber;
  
  beforeEach(async () => {
    signers = await ethers.getSigners();
    const gtnFactory = await ethers.getContractFactory(`${contractName}`);
    gtn = (await gtnFactory.deploy({ value: utils.parseEther('1.0') })) as GuessTheNumber;
    await gtn.deployed();
    expect(gtn.address).to.properAddress;
  });

  describe('Guess', async () => {
    it('should return true if the number was guessed', async () => {
      await gtn.connect(signers[1]).guess(42, { value: utils.parseEther('1.0') });
      const result = await gtn.isComplete();
      expect(result).to.be.true;
    });
  });
});