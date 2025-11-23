import WalletComponent from "./walletComponent";
import TransactionComponent from "./transactionComponent";
import TokenComponent from "./tokenComponent";
import ERC20Component from "./erc20Component";
export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="flex flex-col min-h-screen">
        <WalletComponent />
        <TransactionComponent />
        <TokenComponent />
        <ERC20Component />
      </div>
    </main>
  );
}