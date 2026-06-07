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
  author: string;
  message: string;
  pubkey: string;
}

function decodeMessageAccountFull(data: Buffer): { author: string; message: string } | null {
  try {
    const author = new PublicKey(data.slice(8, 40)).toBase58();
    const offset = 40;
    const strLen = data.readUInt32LE(offset);
    const message = data.slice(offset + 4, offset + 4 + strLen).toString("utf8");
    return { author, message };
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
      const messages = accounts
        .map(({ pubkey, account }) => {
          const decoded = decodeMessageAccountFull(account.data as Buffer);
          if (!decoded) return null;
          return {
            author: decoded.author,
            message: decoded.message,
            pubkey: pubkey.toBase58(),
          };
        })
        .filter((m): m is MessageEntry => m !== null);
      setAllMessages(messages);
    } catch {
      setError("Failed to load messages");
      setAllMessages([]);
    } finally {
      setFetching(false);
    }
  }, [connection]);

  const sendTransaction = useCallback(
    async (data: Uint8Array, extraAccounts: AccountMeta[]) => {
      if (!wallet.publicKey || !wallet.signTransaction) return;
      setLoading(true);
      try {
        const pda = await getMessagePDA(wallet.publicKey.toBase58());
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
      } finally {
        setLoading(false);
      }
    },
    [wallet, connection, fetchAllMessages]
  );

  const createMessage = useCallback(
    async (text: string) => {
      const data = buildCreateMessageData(text);
      await sendTransaction(data, [
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);
    },
    [sendTransaction]
  );

  const updateMessage = useCallback(
    async (text: string) => {
      const data = buildUpdateMessageData(text);
      await sendTransaction(data, []);
    },
    [sendTransaction]
  );

  const deleteMessage = useCallback(async () => {
    const data = buildDeleteMessageData();
    await sendTransaction(data, []);
  }, [sendTransaction]);

  useEffect(() => {
    const id = setTimeout(() => fetchAllMessages(), 0);
    return () => clearTimeout(id);
  }, [fetchAllMessages]);

  const myAddress = wallet.publicKey?.toBase58();
  const myMessage = myAddress
    ? allMessages.find((m) => m.author === myAddress) ?? null
    : null;

  return {
    allMessages,
    myMessage,
    loading,
    fetching,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    refetch: fetchAllMessages,
  };
}
