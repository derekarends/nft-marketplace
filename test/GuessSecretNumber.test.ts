import { ethers } from 'hardhat';
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
import { GuessSecretNumber } from '../typechain/GuessSecretNumber';
import { utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { hexlify, keccak256 } from 'ethers/lib/utils';

chai.use(solidity);
const contractName = 'GuessSecretNumber';
const { expect } = chai;

describe(`${contractName}`, () => {
  let signers: SignerWithAddress[];
  let gsn: GuessSecretNumber;
  
  beforeEach(async () => {
    signers = await ethers.getSigners();
    const gtnFactory = await ethers.getContractFactory(`${contractName}`);

    let blockNumBefore = await ethers.provider.getBlockNumber();
    let blockBefore = await ethers.provider.getBlock(blockNumBefore);
    // console.log(blockBefore);
    
    gsn = (await gtnFactory.deploy({ value: utils.parseEther('1.0') })) as GuessSecretNumber;
    await gsn.deployed();
    expect(gsn.address).to.properAddress;

    blockNumBefore = await ethers.provider.getBlockNumber();
    blockBefore = await ethers.provider.getBlock(blockNumBefore);
    // console.log(blockBefore);

    const tx = await ethers.provider.getTransaction(blockBefore.transactions[0]);
    // console.log(tx);
    // const timestampBefore = blockBefore.timestamp;
  });

  describe('Guess', async () => {
    it('should return true if the number was guessed', async () => {
      const answerHash = '0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365';

      let foundIt = false;
      for (let i = 0; i < 2 ** 8; i++){
        if (keccak256(hexlify(i)) === answerHash) {
          foundIt = true;
          await gsn.connect(signers[1]).guess(170, { value: utils.parseEther('1.0') });
          const result = await gsn.isComplete();
          expect(result).to.be.true;
        }
      }
      
      if (!foundIt) {
        expect.fail('Should have found secret');
      }
    });
  });
});