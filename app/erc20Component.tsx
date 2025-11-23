"use client";
import { useState, useEffect } from "react";
import { getContract, Address, formatUnits } from "viem";
import { erc20Abi } from "./erc20Abi";
import { ConnectWalletClient, ConnectPublicClient } from "./client";

export default function ERC20Component() {
  const [contractAddress, setContractAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletClient, setWalletClient] = useState<any>(null);
  const [publicClient, setPublicClient] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const client = ConnectWalletClient();
    const pubClient = ConnectPublicClient();
    setWalletClient(client);
    setPublicClient(pubClient);
  }, []);

  const setValue = (setter: any) => (evt: any) => setter(evt.target.value);

  async function getTokenInfo() {
    if (!publicClient || !walletClient) {
      alert("Clients not initialized yet");
      return;
    }
    if (!contractAddress) {
      alert("Enter contract address");
      return;
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress.trim())) {
      alert("Invalid contract address format. Please enter a valid Ethereum address (0x...).");
      return;
    }

    setLoading(true);
    try {
      const checkedAddress = contractAddress.trim() as Address;
      
      // Check if address is a contract
      const bytecode = await publicClient.getBytecode({ address: checkedAddress });
      if (!bytecode || bytecode === "0x") {
        alert("The address provided is not a contract. Please enter a valid contract address.");
        return;
      }

      const contract = getContract({
        address: checkedAddress,
        abi: erc20Abi,
        client: publicClient,
      });

      // Try to read contract functions individually with better error handling
      let name: string | null = null;
      let symbol: string | null = null;
      let decimals: number | null = null;
      let totalSupply: bigint | null = null;

      try {
        name = await contract.read.name();
      } catch (error: any) {
        console.error("Error reading name:", error);
        throw new Error(`Contract does not have a "name" function or it returned no data. This might not be an ERC20 token. Error: ${error.message || error}`);
      }

      try {
        symbol = await contract.read.symbol();
      } catch (error: any) {
        console.error("Error reading symbol:", error);
        throw new Error(`Contract does not have a "symbol" function. Error: ${error.message || error}`);
      }

      try {
        const decimalsValue = await contract.read.decimals();
        decimals = Number(decimalsValue);
      } catch (error: any) {
        console.error("Error reading decimals:", error);
        // Some old ERC20 tokens don't have decimals, default to 18
        decimals = 18;
      }

      try {
        totalSupply = await contract.read.totalSupply();
      } catch (error: any) {
        console.error("Error reading totalSupply:", error);
        totalSupply = null;
      }

      let balance = null;
      let balanceAddress = walletAddress;
      
      // If no wallet address specified, try to get connected wallet address
      if (!balanceAddress) {
        try {
          const [address] = await walletClient.getAddresses();
          if (address) {
            balanceAddress = address;
          }
        } catch (error) {
          console.error("Error getting wallet address:", error);
        }
      }

      if (balanceAddress) {
        try {
          if (!/^0x[a-fA-F0-9]{40}$/.test(balanceAddress.trim())) {
            console.error("Invalid wallet address format");
          } else {
            const checkedWalletAddress = balanceAddress.trim() as Address;
            balance = await contract.read.balanceOf([checkedWalletAddress]);
          }
        } catch (error) {
          console.error("Error getting balance:", error);
        }
      }

      setTokenInfo({
        name,
        symbol,
        decimals: decimals || 18,
        totalSupply,
        balance,
        balanceAddress: balanceAddress || null,
        contractAddress: checkedAddress,
      });
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      alert(`Error: ${errorMessage}\n\nPossible reasons:\n- The address is not a contract\n- The contract is not an ERC20 token\n- The contract does not implement required functions\n- You are connected to the wrong network (should be Sepolia)`);
    } finally {
      setLoading(false);
    }
  }

  async function transferTokens() {
    if (!walletClient) {
      alert("Wallet client not initialized yet");
      return;
    }
    if (!contractAddress || !tokenInfo) {
      alert("Get token info first");
      return;
    }
    
    if (!walletAddress) {
      alert("Please enter recipient address");
      return;
    }

    const amount = prompt(`Enter amount to transfer (in ${tokenInfo.symbol}):`);
    if (!amount) return;

    try {
      const [address] = await walletClient.getAddresses();
      const checkedAddress = contractAddress as Address;
      const checkedRecipient = walletAddress as Address;
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** tokenInfo.decimals));

      const contract = getContract({
        address: checkedAddress,
        abi: erc20Abi,
        client: walletClient,
      });

      const hash = await contract.write.transfer([checkedRecipient, amountInWei], {
        account: address,
      });

      alert(`Transfer successful! Transaction Hash: ${hash}`);
      
      // Refresh balance after a delay
      setTimeout(() => getTokenInfo(), 3000);
    } catch (error: any) {
      alert(`Transfer failed: ${error.message || error}`);
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4 " >ERC20 Token Interaction</h2>
      
      <label>
        Contract Address:
        <input
          placeholder="0x... (e.g., WETH on Sepolia: 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9)"
          value={contractAddress}
          onChange={setValue(setContractAddress)}
          className="w-full mt-1 p-2 border rounded "
        />
        <small className="text-gray-500 text-xs">
          Убедитесь, что вы подключены к тестовой сети Sepolia
        </small>
      </label>
      <br />
      
      <label>
        Адрес кошелька (необязательно, для проверки баланса или получения перевода):
        <input
          placeholder="0x... "
          value={walletAddress}
          onChange={setValue(setWalletAddress)}
          className="w-full mt-1 p-2 border rounded"
        />
      </label>
      <br />
      
      <button
        className="px-8 py-2 rounded-md flex flex-row items-center justify-center border border-[#1e2124] hover:border-indigo-600 shadow-md shadow-indigo-500/10 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={getTokenInfo}
        disabled={loading}
      >
        <h1 className="text-center">{loading ? "Loading..." : "Get Token Info"}</h1>
      </button>

      {tokenInfo && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg ">
          <h3 className="font-semibold mb-2">Token Information:</h3>
          <p><strong>Name:</strong> {tokenInfo.name}</p>
          <p><strong>Symbol:</strong> {tokenInfo.symbol}</p>
          <p><strong>Decimals:</strong> {tokenInfo.decimals}</p>
          <p>
            <strong>Total Supply:</strong>{" "}
            {formatUnits(tokenInfo.totalSupply, tokenInfo.decimals)} {tokenInfo.symbol}
          </p>
          {tokenInfo.balance !== null && (
            <p>
              <strong>Balance {tokenInfo.balanceAddress ? `(${tokenInfo.balanceAddress.slice(0, 6)}...${tokenInfo.balanceAddress.slice(-4)})` : ''}:</strong>{" "}
              {formatUnits(tokenInfo.balance, tokenInfo.decimals)} {tokenInfo.symbol}
            </p>
          )}
          
          <button
            className="px-6 py-2 mt-4 rounded-md flex flex-row items-center justify-center border border-[#1e2124] hover:border-green-600 shadow-md shadow-green-500/10 bg-green-50"
            onClick={transferTokens}
          >
            Transfer Tokens
          </button>
        </div>
      )}
    </div>
  );
}

