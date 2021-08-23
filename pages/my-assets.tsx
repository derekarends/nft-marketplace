import * as React from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import Web3Modal from "web3modal";
import MarketContract from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json';
import { nftmarketaddress, nftaddress } from '../config';
import { NFT } from '../typechain/NFT';
import { NFTMarket } from '../typechain/NFTMarket';

enum State {
  loading,
  pending
}

function MyAssets() {
  const [nfts, setNfts] = React.useState([]);
  const [loadingState, setLoadingState] = React.useState(State.loading);
  
  React.useEffect(() => {
    loadNFTs()
  }, []);

  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
    })
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const nftMarket = new ethers.Contract(nftmarketaddress, MarketContract.abi, signer) as NFTMarket;
    const nft = new ethers.Contract(nftaddress, NFTContract.abi, provider) as NFT;
    const data = await nftMarket.fetchMyNFTs();

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      const price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      const item = {
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      };
      return item;
    }))
    setNfts(items);
    setLoadingState(State.pending);
  }

  if (loadingState === State.loading) {
    return (<h2>loading...</h2>);
  }

  if (nfts.length === 0) {
    return (<h2>No assets owned</h2>);
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
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default MyAssets;
