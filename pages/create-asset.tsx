import * as React from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import { NFT } from '../typechain/NFT';
import { NFTMarket } from '../typechain/NFTMarket';
import { nftaddress, nftmarketaddress } from '../config'
import NFTContract from '../artifacts/contracts/NFT.sol/NFT.json'
import MarketContract from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

const client = ipfsHttpClient({
  url: 'https://ipfs.infura.io:5001/api/v0'
});

function CreateAsset() {
  const [fileUrl, setFileUrl] = React.useState(null)
  const [formInput, onFormInputChange] = React.useState({ price: '', name: '', description: '' })
  const router = useRouter()

  async function onFileInputChange(e: any) {
    const file = e.target.files[0]
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }
  }

  function validate(e: any): boolean {
    var form = document.querySelector('.needs-validation') as HTMLFormElement;
    form.classList.add('was-validated')
    if (!form.checkValidity()) {
      e.stopPropagation();
      return false;
    }
    return true;
  }

  async function createMarketItem(e: any) {
    e.preventDefault();
    if (!validate(e)) {
      return;
    }

    const { name, description } = formInput;
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl
    });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      /* after file is uploaded to IPFS, pass the URL to save it on Polygon */
      createSale(url);
    } catch (error) {
      console.log('Error uploading file: ', error);
    }
  }

  async function createSale(url: string) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    /* next, create the item */
    const nftContract = new ethers.Contract(nftaddress, NFTContract.abi, signer) as NFT;
    let transaction = await nftContract.createToken(url);
    const tx = await transaction.wait();
    const event = tx.events[0];
    const value = event.args[2];
    const tokenId = value.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, 'ether');

    /* then list the item for sale on the marketplace */
    const marketcontract = new ethers.Contract(nftmarketaddress, MarketContract.abi, signer) as NFTMarket;
    const listingPrice = await marketcontract.getListingPrice();

    transaction = await marketcontract.createItem(nftaddress, tokenId, price, { value: listingPrice });
    await transaction.wait();
    router.push('/');
  }

  return (
    <div className="col-6 offset-3 mt-3 mb-3">
      <h2>Create an Asset</h2>
      <form onSubmit={createMarketItem} className="row g-3 needs-validation" noValidate>
        <div className="col-12">
          <label htmlFor="createAsset" className="form-label">Asset Name</label>
          <input
            id="createAsset"
            className="form-control"
            onChange={e => onFormInputChange({ ...formInput, name: e.target.value })}
            required
          />
          <div className="invalid-feedback">
            Asset Name is required.
          </div>
        </div>
        <div className="col-12">
          <label htmlFor="assetDescription" className="form-label">Asset Description</label>
          <textarea
            id="assetDescription"
            className="form-control"
            onChange={e => onFormInputChange({ ...formInput, description: e.target.value })}
            required
          />
          <div className="invalid-feedback">
            Asset Description is required.
          </div>
        </div>
        <div className="col-12">
          <label htmlFor="assetPrice" className="form-label">Asset Price</label>
          <div className="input-group has-validation">
            <input
              id="assetPrice"
              className="form-control"
              onChange={e => onFormInputChange({ ...formInput, price: e.target.value })}
              required
            />
            <span className="input-group-text">ETH</span>
            <div className="invalid-feedback">
              Asset Price is required.
            </div>
          </div>
        </div>
        <div className="col-12">
          <label htmlFor="assetFile" className="form-label">Asset</label>
          <input
            id="assetFile"
            type="file"
            name="Asset"
            className="form-control"
            onChange={onFileInputChange}
            required
          />
          <div className="invalid-feedback">
            Asset is required.
          </div>
          {
            fileUrl && (
              <img className="rounded mt-4" width="350" src={fileUrl} />
            )
          }
        </div>
        <div className="col-12">
          <button onClick={createMarketItem} className="btn btn-primary">
            Create Digital Asset
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAsset;
