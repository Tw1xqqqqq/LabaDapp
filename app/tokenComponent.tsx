"use client";
import { useState, useEffect } from "react";
import { getContract, Address } from "viem";
import { contractAbi } from "./abi";
import { ConnectWalletClient } from "./client";

export default function TokenComponent() {
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [walletClient, setWalletClient] = useState<any>(null);

  useEffect(() => {
    const client = ConnectWalletClient();
    setWalletClient(client);
  }, []);

  const setValue = (setter: any) => (evt: any) => setter(evt.target.value);

  async function buttonClick() {
    if (!walletClient) {
      alert("Wallet client not initialized yet");
      return;
    }
    if (!contractAddress || !tokenId) {
      alert("Enter contract address and token ID");
      return;
    }

    const checkedAddress = contractAddress as Address;
    const contract = getContract({
      address: checkedAddress,
      abi: contractAbi,
      client: walletClient,
    });

    const symbol = await contract.read.symbol();
    const name = await contract.read.name();
    const token_id = BigInt(tokenId);
    const owner = await contract.read.ownerOf([token_id]);

    alert(`Symbol: ${symbol}\nName: ${name}\nOwner of token_id = ${token_id} is ${owner}`);
  }

  return (
    <div className="card">
      <label>
        Address:
        <input
          placeholder="Smart Contract Instance"
          value={contractAddress}
          onChange={setValue(setContractAddress)}
        />
      </label>
      <br />
      <label>
        Token Id:
        <input
          placeholder="1"
          value={tokenId}
          onChange={setValue(setTokenId)}
        />
      </label>
      <button
        className="px-8 py-2 rounded-md flex flex-row items-center justify-center border border-[#1e2124] hover:border-indigo-600 shadow-md shadow-indigo-500/10"
        onClick={buttonClick}
      >
        <h1 className="text-center">Token Info</h1>
      </button>
    </div>
  );
}
