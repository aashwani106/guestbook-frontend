"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getMessagePDA,
  buildCreateMessageData,
  buildUpdateMessageData,
  buildDeleteMessageData,
} from "../lib/instructions";
import { PROGRAM_ID } from "../lib/constants";

 
function decodeMessageAccount(data: Buffer): string | null {
  try {
    const offset = 8 + 32; // skip discriminator + author pubkey
    const strLen = data.readUInt32LE(offset);
    const message = data.slice(offset + 4, offset + 4 + strLen).toString("utf8");
    return message;
  } catch {
    return null;
  }
}

export function useGuestbook() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchMessage = useCallback(async () => {
    if (!wallet.publicKey) return;
    setFetching(true);
    try {
      const pda = await getMessagePDA(wallet.publicKey.toBase58());
      const accountInfo = await connection.getAccountInfo(
        new PublicKey(pda.toString())
      );
      if (!accountInfo) {
        setMessage(null);
        return;
      }
      const decoded = decodeMessageAccount(accountInfo.data as Buffer);
      setMessage(decoded);
    } catch {
      setMessage(null);
    } finally {
      setFetching(false);
    }
  }, [wallet.publicKey, connection]);

  // Generic transaction sender
  const sendTransaction = useCallback(
    async (data: Uint8Array, extraAccounts: any[]) => {
      if (!wallet.publicKey || !wallet.signTransaction) return;
      setLoading(true);
      try {
        const pda = await getMessagePDA(wallet.publicKey.toBase58());
        const pdaPubkey = new PublicKey(pda.toString());
        const programPubkey = new PublicKey(PROGRAM_ID);

        const ix = new TransactionInstruction({
          programId: programPubkey,
          keys: [
            {
              pubkey: wallet.publicKey,
              isSigner: true,
              isWritable: true,
            },
            {
              pubkey: pdaPubkey,
              isSigner: false,
              isWritable: true,
            },
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

        await fetchMessage();
      } finally {
        setLoading(false);
      }
    },
    [wallet, connection, fetchMessage]
  );

  const createMessage = useCallback(
    async (text: string) => {
      const data = buildCreateMessageData(text);
      // createMessage needs SystemProgram as 3rd account
      await sendTransaction(data, [
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        },
      ]);
    },
    [sendTransaction]
  );

  const updateMessage = useCallback(
    async (text: string) => {
      const data = buildUpdateMessageData(text);
      await sendTransaction(data, []); // no extra accounts for update
    },
    [sendTransaction]
  );

  const deleteMessage = useCallback(async () => {
    const data = buildDeleteMessageData();
    await sendTransaction(data, []); // no extra accounts for delete
  }, [sendTransaction]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return {
    message,
    loading,
    fetching,
    createMessage,
    updateMessage,
    deleteMessage,
  };
}