"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useGuestbook } from "../app/hooks/useGuestbook";

export default function Home() {
  const { connected, publicKey } = useWallet();
  const { message, loading, fetching, createMessage, updateMessage, deleteMessage } =
    useGuestbook();

  const [input, setInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleCreate = async () => {
    if (!input.trim()) return;
    await createMessage(input.trim());
    setInput("");
  };

  const handleUpdate = async () => {
    if (!input.trim()) return;
    await updateMessage(input.trim());
    setInput("");
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">

      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">📖 Guestbook</h1>
        <p className="text-gray-400 text-sm">Leave a message on Solana devnet</p>
      </div>

      {/* Wallet Button */}
      <div className="mb-8">
        <WalletMultiButton />
      </div>

      {/* Wallet address pill */}
      {connected && publicKey && (
        <p className="text-xs text-gray-500 mb-6 font-mono">
          {publicKey.toBase58().slice(0, 6)}...{publicKey.toBase58().slice(-4)}
        </p>
      )}

      {/* Main Card */}
      {connected && (
        <div className="w-full max-w-md bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">

          {/* Loading state */}
          {fetching && (
            <p className="text-gray-500 text-sm text-center animate-pulse">
              Fetching your message...
            </p>
          )}

          {/* No message yet */}
          {!fetching && !message && !isEditing && (
            <>
              <p className="text-gray-400 text-sm">
                You haven't posted a message yet.
              </p>
              <textarea
                className="w-full bg-gray-800 rounded-xl p-3 text-sm text-white resize-none outline-none focus:ring-2 focus:ring-purple-500 transition"
                rows={3}
                placeholder="Write your message... (max 280 chars)"
                maxLength={280}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">{input.length}/280</span>
                <button
                  onClick={handleCreate}
                  disabled={loading || !input.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl px-5 py-2 text-sm font-medium transition"
                >
                  {loading ? "Posting..." : "Post Message"}
                </button>
              </div>
            </>
          )}

          {/* Has message, not editing */}
          {!fetching && message && !isEditing && (
            <>
              <div className="bg-gray-800 rounded-xl p-4 text-sm text-white leading-relaxed">
                {message}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setInput(message); setIsEditing(true); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl py-2 text-sm font-medium transition"
                >
                  Edit
                </button>
                <button
                  onClick={deleteMessage}
                  disabled={loading}
                  className="flex-1 bg-red-800 hover:bg-red-700 disabled:opacity-40 rounded-xl py-2 text-sm font-medium transition"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          )}

          {/* Editing */}
          {!fetching && isEditing && (
            <>
              <textarea
                className="w-full bg-gray-800 rounded-xl p-3 text-sm text-white resize-none outline-none focus:ring-2 focus:ring-purple-500 transition"
                rows={3}
                maxLength={280}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={loading || !input.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl py-2 text-sm font-medium transition"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setIsEditing(false); setInput(""); }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl py-2 text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {!connected && (
        <p className="text-gray-600 text-sm mt-2">
          Connect your wallet to get started
        </p>
      )}
    </main>
  );
}