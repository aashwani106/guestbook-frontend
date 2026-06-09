"use client";

import { useCallback, useMemo } from "react";
import type { WalletError } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { RPC_ENDPOINT } from "../lib/constants";
import "@solana/wallet-adapter-react-ui/styles.css";

function isUserRejectedWalletError(error: WalletError) {
  const message = error.message.toLowerCase();

  return (
    error.name === "WalletSignTransactionError" &&
    message.includes("user rejected")
  );
}

export default function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => [], []);
  const handleWalletError = useCallback((error: WalletError) => {
    if (isUserRejectedWalletError(error)) return;

    console.error(error);
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={handleWalletError}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
