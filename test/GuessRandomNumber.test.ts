import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { GuessRandomNumber } from '../typechain/GuessRandomNumber';
import { BigNumber, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { hexlify, keccak256 } from 'ethers/lib/utils';
import { Block } from "@ethersproject/abstract-provider";

chai.use(solidity);
const contractName = 'GuessRandomNumber';
const { expect } = chai;

describe(`${contractName}`, () => {
  let signers: SignerWithAddress[];
  let grn: GuessRandomNumber;
  let prevBlock: Block;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    const gtnFactory = await ethers.getContractFactory(`${contractName}`);
    const prevBlockNum = await ethers.provider.getBlockNumber();
    prevBlock = await ethers.provider.getBlock(prevBlockNum);

    grn = (await gtnFactory.deploy({ value: utils.parseEther('1.0') })) as GuessRandomNumber;
    await grn.deployed();
    expect(grn.address).to.properAddress;
  });

  describe('Guess', async () => {
    it('should return true if the number was guessed from storage', async () => {
      const value = await ethers.provider.getStorageAt(grn.address, 0);
      const guess = BigNumber.from(value).toBigInt();

      await grn.connect(signers[1]).guess(guess, { value: utils.parseEther('1.0') });
      const result = await grn.isComplete();
      expect(result).to.be.true;
    });

    it('should return true if the number was guessed from calculation', async () => {
      // answer = uint8(uint(keccak256(abi.encode(blockhash(block.number - 1)))));
      const value = keccak256(prevBlock.parentHash);
      console.log(parseInt(value));
      const guess = 5;
      await grn.connect(signers[1]).guess(guess, { value: utils.parseEther('1.0') });
      const result = await grn.isComplete();
      expect(result).to.be.true;
    });
  });
});