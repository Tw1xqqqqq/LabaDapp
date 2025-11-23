"use client";
import { useState } from "react";
import { ConnectWalletClient, ConnectPublicClient } from "./client";

export default function WalletComponent() {
    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState(BigInt(0));
    async function handleClick() {
    try {
        if (!window.ethereum) throw new Error("No Ethereum wallet found");

        // Запросить подключение кошелька
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const walletClient = ConnectWalletClient();
        const publicClient = ConnectPublicClient();

        const addresses = await walletClient.getAddresses();
        if (!addresses || addresses.length === 0) throw new Error("No wallet connected");

        const rawAddress = addresses[0];
        if (!/^0x[a-fA-F0-9]{40}$/.test(rawAddress)) throw new Error("Invalid Ethereum address");
        const address = rawAddress as `0x${string}`;

        const balance: bigint = await publicClient.getBalance({ address });

        setAddress(address);
        setBalance(balance);
    } catch (error) {
        alert(`Transaction failed: ${error}`);
    }
}

    return (
        <div className="card">
            <Status address={address} balance={balance} />
            <button className="px-8 py-2 rounded-md
                    flex flex-row items-center justify-center
                    border border-[#1e2124] 
                    hover:border-indigo-600
                    shadow-md shadow-indigo-500/10"
                onClick={handleClick} >
                <h1 className="mx-auto">Connect Wallet</h1>
            </button>
        </div>
    );
}
function Status({
    address,
    balance,
}: {
    address: string | null;
    balance: BigInt;
}) {
    if (!address) {
        return (
            <div className="flex items-center">
                <div className="border bg-red-600 border-red-600 rounded-full w-1.5 h-1.5 mr-2 my-8"></div>
                <div>Disconnected</div>
            </div>
        );
    }

    return (
        <div className="flex items-center w-full">
            <div className="border bg-green-500 border-green-500 rounded-full w-1.5 h-1.5 mr-2 my-8"></div>
            <div className="text-s md:text-s">
                {address} <br /> <b>Balance:</b> {balance.toString()} <b>Wei</b>
            </div>
        </div>
    );
}
