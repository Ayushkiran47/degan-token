import React, { useEffect, useState } from "react";
import { ethers, formatUnits, parseUnits } from "ethers";
import "./DeganTokenApp.css";
import DeganTokenABI from "./DeganTokenABI.json";

const contractAddress = "0x513431209Bf712E5de1ee668953C553C4fd7e6dB";
const abi = DeganTokenABI;

function DeganTokenApp() {
  const [userAddress, setUserAddress] = useState("");
  const [dgnBalance, setDgnBalance] = useState("0");
  const [contract, setContract] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [userNfts, setUserNfts] = useState([]);
  const [newNft, setNewNft] = useState({ name: "", url: "", price: "" });
  const [isOwner, setIsOwner] = useState(false);
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [transferDetails, setTransferDetails] = useState({
    address: "",
    amount: "",
  });

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(
          contractAddress,
          abi,
          signer
        );

        setContract(contractInstance);

        const address = await signer.getAddress();
        setUserAddress(address);

        try {
          const balance = await contractInstance.balanceOf(address);
          setDgnBalance(balance ? formatUnits(balance, 18) : "0");
        } catch (error) {
          console.error("Error fetching balance:", error);
          setDgnBalance("0");
        }

        const owner = await contractInstance.owner();
        setIsOwner(owner === address);

        try {
          const allNfts = await contractInstance.getAllNFTs();
          const nftDetails = await Promise.all(
            allNfts.map(async (nftName) => {
              const nft = await contractInstance.NFTs(nftName);
              return nft
                ? {
                    name: nftName,
                    url: nft.url || "",
                    price: nft.price || "0",
                    isAvailable: nft.isAvailable || false,
                  }
                : null;
            })
          );
          setNfts(nftDetails.filter((nft) => nft !== null));
        } catch (error) {
          console.error("Error fetching NFTs:", error);
          setNfts([]);
        }

        try {
          const userNftsList = await contractInstance.getUserNFTs();
          const userNftDetails = await Promise.all(
            userNftsList.map(async (nftName) => {
              const nft = await contractInstance.NFTs(nftName);
              return nft
                ? {
                    name: nftName,
                    url: nft.url || "",
                    price: nft.price || "0",
                    isAvailable: nft.isAvailable || false,
                  }
                : null;
            })
          );
          setUserNfts(userNftDetails.filter((nft) => nft !== null));
        } catch (error) {
          console.error("Error fetching user NFTs:", error);
          setUserNfts([]);
        }
      }
    };

    init();

    window.ethereum.on("accountsChanged", init);

    return () => {
      window.ethereum.removeListener("accountsChanged", init);
    };
  }, []);

  const handleTransaction = async (transactionPromise, successMessage) => {
    try {
      const tx = await transactionPromise;
      const receipt = await tx.wait(); // Wait for transaction to be mined
      if (receipt.status === 1) {
        alert(successMessage);
        const balance = await contract.balanceOf(userAddress);
        setDgnBalance(formatUnits(balance, 18));
        const userNftsList = await contract.getUserNFTs();
        const userNftDetails = await Promise.all(
          userNftsList.map(async (nftName) => {
            const nft = await contract.NFTs(nftName);
            return nft
              ? {
                  name: nftName,
                  url: nft.url || "",
                  price: nft.price || "0",
                  isAvailable: nft.isAvailable || false,
                }
              : null;
          })
        );
        setUserNfts(userNftDetails.filter((nft) => nft !== null));
        const allNfts = await contract.getAllNFTs();
        const nftDetails = await Promise.all(
          allNfts.map(async (nftName) => {
            const nft = await contract.NFTs(nftName);
            return nft
              ? {
                  name: nftName,
                  url: nft.url || "",
                  price: nft.price || "0",
                  isAvailable: nft.isAvailable || false,
                }
              : null;
          })
        );
        setNfts(nftDetails.filter((nft) => nft !== null));
      } else {
        alert("Transaction failed!");
      }
    } catch (error) {
      console.error("Transaction error:", error);
      alert("Transaction failed.");
    }
  };

  const mintDGN = async () => {
    if (!isOwner) return;
    handleTransaction(
      contract.mint(userAddress, parseUnits(mintAmount, 18)),
      "DGN minted successfully!"
    );
    setMintAmount("");
  };

  const burnDGN = async () => {
    handleTransaction(
      contract.burn(parseUnits(burnAmount, 18)),
      "DGN burned successfully!"
    );
    setBurnAmount("");
  };

  const transferDGN = async () => {
    handleTransaction(
      contract.transfer(
        transferDetails.address,
        parseUnits(transferDetails.amount, 18)
      ),
      "DGN transferred successfully!"
    );
    setTransferDetails({ address: "", amount: "" });
  };

  const createNFT = async () => {
    handleTransaction(
      contract.generateNFT(
        newNft.name,
        newNft.url,
        parseUnits(newNft.price, 18)
      ),
      "NFT created successfully!"
    );
    setNewNft({ name: "", url: "", price: "" });
  };

  const buyNFT = async (nftName) => {
    handleTransaction(contract.redeem(nftName), "NFT purchased successfully!");
  };

  return (
    <>
      <div>
        <h2>DeganToken Kitty Store</h2>
      </div>
      <div className="App">
        <nav>
          <p>User Address: {userAddress}</p>
          <p>Contract Address: {contractAddress}</p>
        </nav>
        <nav>
          <p>DGN Balance: {dgnBalance} DGN</p>
        </nav>
        <section>
          {isOwner && (
            <div>
              <h3>Mint DGN (Owner Only)</h3>
              <input
                type="number"
                placeholder="Amount to Mint"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
              />
              <button onClick={mintDGN}>Mint DGN</button>
            </div>
          )}
          <div>
            <h3>Burn DGN</h3>
            <input
              type="number"
              placeholder="Amount to Burn"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
            />
            <button onClick={burnDGN}>Burn DGN</button>
          </div>
          <div>
            <h3>Transfer DGN</h3>
            <input
              type="text"
              placeholder="Recipient Address"
              value={transferDetails.address}
              onChange={(e) =>
                setTransferDetails({
                  ...transferDetails,
                  address: e.target.value,
                })
              }
            />
            <input
              type="number"
              placeholder="Amount to Transfer"
              value={transferDetails.amount}
              onChange={(e) =>
                setTransferDetails({
                  ...transferDetails,
                  amount: e.target.value,
                })
              }
            />
            <button onClick={transferDGN}>Transfer DGN</button>
          </div>
        </section>

        {isOwner && (
          <section className="owner-section">
            <h3>Create New NFT</h3>
            <input
              type="text"
              placeholder="NFT Name"
              value={newNft.name}
              onChange={(e) => setNewNft({ ...newNft, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="NFT URL"
              value={newNft.url}
              onChange={(e) => setNewNft({ ...newNft, url: e.target.value })}
            />
            <input
              type="number"
              placeholder="NFT Price (in DGN)"
              value={newNft.price}
              onChange={(e) => setNewNft({ ...newNft, price: e.target.value })}
            />
            <button onClick={createNFT}>Create NFT</button>
          </section>
        )}

        <section>
          <h3>Available NFTs</h3>
          {nfts.length > 0 ? (
            <div className="nft-list">
              {console.log({ nfts })}
              {nfts.map((nft, index) => (
                <div key={index} className="nft-item">
                  <img src={nft.url} alt={nft.name} />
                  <p>Name: {nft.name}</p>
                  <p>Price: {formatUnits(nft.price, 18)} DGN</p>
                  {nft.isAvailable && (
                    <button onClick={() => buyNFT(nft.name)}>Buy</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No NFTs available.</p>
          )}
        </section>

        <section>
          <h3>Your NFTs</h3>
          {userNfts.length > 0 ? (
            <div className="nft-list">
              {userNfts.map((nft, index) => (
                <div key={index} className="nft-item">
                  <img src={nft.url} alt={nft.name} />
                  <p>Name: {nft.name}</p>
                  <p>Price: {formatUnits(nft.price, 18)} DGN</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No NFTs owned.</p>
          )}
        </section>
      </div>
    </>
  );
}

export default DeganTokenApp;
