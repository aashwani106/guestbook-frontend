"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  type AccountMeta,
} from "@solana/web3.js";
import {
  getMessagePDA,
  buildCreateMessageData,
  buildUpdateMessageData,
  buildDeleteMessageData,
} from "../lib/instructions";
import { PROGRAM_ID } from "../lib/constants";

export interface MessageEntry {
  id: number;
  author: string;
  message: string;
  pubkey: string;
  sortKey: number;
}

function getTransactionErrorMessage(err: unknown) {
  if (err && typeof err === "object") {
    const maybeError = err as { code?: unknown; message?: unknown; name?: unknown };
    const message =
      typeof maybeError.message === "string" ? maybeError.message : "";
    const name = typeof maybeError.name === "string" ? maybeError.name : "";

    if (
      maybeError.code === 4001 ||
      name.includes("WalletSignTransactionError") ||
      message.toLowerCase().includes("user rejected")
    ) {
      return "Transaction cancelled in wallet";
    }

    if (message) return message;
  }

  return "Transaction failed. Please try again.";
}

function decodeMessageAccountFull(data: Buffer): { id: number; author: string; message: string } | null {
  try {
    const author = new PublicKey(data.slice(8, 40)).toBase58();
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const id = Number(view.getBigUint64(40, true));
    const strLen = view.getUint32(48, true);
    if (strLen > 280 || 52 + strLen > data.length) return null;
    const message = data.slice(52, 52 + strLen).toString("utf8");
    return { id, author, message };
  } catch {
    return null;
  }
}

export function useGuestbook() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [allMessages, setAllMessages] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMessages = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const programPubkey = new PublicKey(PROGRAM_ID);
      const accounts = await connection.getProgramAccounts(programPubkey);
      const messages = await Promise.all(
        accounts.map(async ({ pubkey, account }) => {
          const decoded = decodeMessageAccountFull(account.data as Buffer);
          if (!decoded) return null;
          const [latestSignature] = await connection.getSignaturesForAddress(
            pubkey,
            { limit: 1 }
          );

          return {
            id: decoded.id,
            author: decoded.author,
            message: decoded.message,
            pubkey: pubkey.toBase58(),
            sortKey: latestSignature?.slot ?? Number.MAX_SAFE_INTEGER,
          };
        })
      );

      setAllMessages(
        messages
          .filter((m): m is MessageEntry => m !== null)
          .sort((a, b) => a.sortKey - b.sortKey)
      );
    } catch {
      setError("Failed to load messages");
      setAllMessages([]);
    } finally {
      setFetching(false);
    }
  }, [connection]);

  const sendTransaction = useCallback(
    async (data: Uint8Array, extraAccounts: AccountMeta[], messageId: number) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setError("Connect a wallet before sending a transaction");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const pda = await getMessagePDA(wallet.publicKey.toBase58(), messageId);
        const pdaPubkey = new PublicKey(pda.toString());
        const programPubkey = new PublicKey(PROGRAM_ID);

        const ix = new TransactionInstruction({
          programId: programPubkey,
          keys: [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: pdaPubkey, isSigner: false, isWritable: true },
            ...extraAccounts,
          ],
          data: Buffer.from(data),
        });

        const tx = new Transaction();
        tx.add(ix);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = wallet.publicKey;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");

        await fetchAllMessages();
        return true;
      } catch (err) {
        setError(getTransactionErrorMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [wallet, connection, fetchAllMessages]
  );

  const createMessage = useCallback(
    async (text: string) => {
      const messageId = Date.now();
      const data = buildCreateMessageData(messageId, text);
      return sendTransaction(data, [
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ], messageId);
    },
    [sendTransaction]
  );

  const updateMessage = useCallback(
    async (messageId: number, text: string) => {
      const data = buildUpdateMessageData(messageId, text);
      return sendTransaction(data, [], messageId);
    },
    [sendTransaction]
  );

  const deleteMessage = useCallback(async (messageId: number) => {
    const data = buildDeleteMessageData(messageId);
    return sendTransaction(data, [], messageId);
  }, [sendTransaction]);

  useEffect(() => {
    const id = setTimeout(() => fetchAllMessages(), 0);
    return () => clearTimeout(id);
  }, [fetchAllMessages]);

  return {
    allMessages,
    loading,
    fetching,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    refetch: fetchAllMessages,
  };
}
