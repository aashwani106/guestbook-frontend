"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGuestbook } from "../app/hooks/useGuestbook";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function addressColor(address: string): string {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
    "from-lime-500 to-green-600",
    "from-fuchsia-500 to-purple-600",
    "from-sky-500 to-indigo-600",
  ];
  const hash = address.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export default function Home() {
  const { connected, publicKey } = useWallet();
  const {
    allMessages,
    loading,
    fetching,
    error,
    createMessage,
    updateMessage,
    deleteMessage,
    refetch,
  } = useGuestbook();

  const hydrated = useHydrated();

  const [input, setInput] = useState("");
  const [editingPubkey, setEditingPubkey] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");

  const myAddress = publicKey?.toBase58();
  const myMessage = allMessages.find((m) => m.author === myAddress) ?? null;

  const handleCreate = async () => {
    if (!input.trim()) return;
    await createMessage(input.trim());
    setInput("");
  };

  const handleUpdate = async () => {
    if (!editInput.trim()) return;
    await updateMessage(editInput.trim());
    setEditingPubkey(null);
    setEditInput("");
  };

  const handleDelete = async () => {
    await deleteMessage();
    setInput("");
    setEditingPubkey(null);
    setEditInput("");
  };

  const startEdit = (msg: { pubkey: string; message: string }) => {
    setEditingPubkey(msg.pubkey);
    setEditInput(msg.message);
  };

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
            Guestbook
          </h1>
          <p className="text-gray-500 text-sm">
            Leave a message on Solana devnet
          </p>
        </div>

        <div className="flex flex-col items-center mb-12">
          {hydrated && (
            <div className="mb-8 [&_.wallet-adapter-button]:!bg-white/10 [&_.wallet-adapter-button]:!backdrop-blur-xl [&_.wallet-adapter-button]:!border [&_.wallet-adapter-button]:!border-white/10 [&_.wallet-adapter-button]:!rounded-xl [&_.wallet-adapter-button]:!h-11 [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button]:!font-medium [&_.wallet-adapter-button:hover]:!bg-white/20 [&_.wallet-adapter-button]:!transition-all [&_.wallet-adapter-button-start-icon]:!mr-2">
              <WalletMultiButton />
            </div>
          )}

          {connected && (
            <div className="w-full max-w-lg bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4 shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)]">
              <p className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                Create message
              </p>
              <textarea
                className="w-full bg-white/5 rounded-xl p-3.5 text-sm text-white placeholder:text-gray-600 resize-none outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 transition-all"
                rows={3}
                placeholder="Write your message... (max 280 chars)"
                maxLength={280}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 font-mono">
                  {input.length}/280
                </span>
                <button
                  onClick={handleCreate}
                  disabled={loading || !input.trim()}
                  className="px-5 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white transition-all focus-visible:ring-2 focus-visible:ring-purple-400/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
                >
                  {loading ? "Sending..." : "Post Message"}
                </button>
              </div>
              {myMessage && (
                <p className="text-xs text-gray-600 italic">
                  Currently: &ldquo;{myMessage.message}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-semibold text-gray-300">
              Messages
            </h2>
            <span className="text-xs text-gray-600 bg-white/[0.04] px-2.5 py-1 rounded-full font-mono">
              {allMessages.length}
            </span>
          </div>

          {fetching && allMessages.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-white/[0.03] animate-pulse border border-white/5"
                />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 max-w-lg mx-auto">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={refetch}
                className="mt-2.5 text-sm text-red-300 hover:text-red-200 underline underline-offset-2 transition focus-visible:ring-2 focus-visible:ring-red-400/50"
              >
                Try again
              </button>
            </div>
          )}

          {!fetching && allMessages.length === 0 && !error && (
            <div className="text-center py-20 text-gray-600 space-y-3">
              <div className="text-5xl">💬</div>
              <p className="text-sm font-medium">No messages yet</p>
              {!connected && (
                <p className="text-xs">Connect your wallet to be the first!</p>
              )}
            </div>
          )}

          {allMessages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMessages.map((msg) => {
                const isOwn = msg.author === myAddress;
                const isEditing = editingPubkey === msg.pubkey;

                return (
                  <div
                    key={msg.pubkey}
                    className={`group relative rounded-2xl p-5 border transition-all duration-200 flex flex-col ${
                      isOwn
                        ? "bg-gradient-to-br from-purple-500/[0.07] to-violet-500/[0.03] border-purple-500/25 shadow-[0_0_25px_-8px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${addressColor(msg.author)} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-lg`}
                      >
                        {msg.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-gray-500 truncate">
                          {truncateAddress(msg.author)}
                        </span>
                        {isOwn && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-full shrink-0">
                            You
                          </span>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 flex-1 flex flex-col">
                        <textarea
                          className="w-full bg-white/5 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 resize-none outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 transition-all flex-1"
                          rows={3}
                          maxLength={280}
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={handleUpdate}
                            disabled={loading || !editInput.trim()}
                            className="flex-1 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white transition-all focus-visible:ring-2 focus-visible:ring-purple-400/50"
                          >
                            {loading ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setEditingPubkey(null);
                              setEditInput("");
                            }}
                            className="flex-1 py-2 text-sm font-medium rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-200 leading-relaxed flex-1">
                          {msg.message}
                        </p>
                        {isOwn && (
                          <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                            <button
                              onClick={() => startEdit(msg)}
                              className="flex-1 py-2 text-sm font-medium rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-white/20"
                            >
                              Edit
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={loading}
                              className="flex-1 py-2 text-sm font-medium rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 disabled:opacity-40 transition-all focus-visible:ring-2 focus-visible:ring-red-400/50"
                            >
                              {loading ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {!connected && hydrated && (
          <p className="text-gray-600 text-sm mt-12 text-center">
            Connect your wallet to post a message
          </p>
        )}
      </div>
    </main>
  );
}
