import * as React from 'react'
import { ethers } from 'ethers'
import axios from 'axios'
import Web3Modal from "web3modal"
import { nftaddress, nftmarketaddress } from '../config'
import { NFTMarket } from '../typechain/NFTMarket';
import { NFT } from '../typechain/NFT';
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json'
import NFTMarketContract from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

enum State {
  loading,
  pending
}

function Home() {
  const [nfts, setNfts] = React.useState([]);
  const [loadingState, setLoadingState] = React.useState<State>(State.loading);
  
  React.useEffect(() => {
    loadNFTs()
  }, []);

  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftaddress, NFTContract.abi, provider) as NFT;
    const marketContract = new ethers.Contract(nftmarketaddress, NFTMarketContract.abi, provider) as NFTMarket;
    const data = await marketContract.fetchUnsoldItems();

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      const item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      };
      return item;
    }));
    setNfts(items);
    setLoadingState(State.pending);
  }

  async function buyNft(nft: any) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(nftmarketaddress, NFTMarketContract.abi, signer) as NFTMarket;

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await contract.createMarketSale(nftaddress, nft.tokenId, {
      value: price
    });
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState === State.loading) {
    return (
      <div className="text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center">
        <h2>No items in marketplace</h2>
      </div>
    );
  }

  return (
    <div className="container g-3">
      <div className="row">
      {
        nfts.map((nft, i) => (
          <div key={i} className="col-sm-6 col-md-4">
            <div className="card mb-3">
              <img src={nft.image} className="card-img-top" alt="..." style={{ height: '200px' }}/>
              <div className="card-body">
                <h5 className="card-title">{nft.name}</h5>
                <p className="card-text">{nft.description}</p>
                <div className="row">
                  <div className="col-6">
                    <p className="card-text">{nft.price} ETH</p>
                  </div>
                  <div className="col-6" style={{
                    display: "flex",
                    justifyContent: "flex-end"
                  }}>
                    <button className="btn btn-primary" onClick={() => buyNft(nft)}>Buy</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
        }
      </div>
    </div>
  )
}

export default Home;
