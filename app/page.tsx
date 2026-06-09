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
    "from-teal-300 to-cyan-500",
    "from-amber-300 to-orange-500",
    "from-rose-300 to-pink-500",
    "from-lime-300 to-emerald-500",
    "from-sky-300 to-blue-500",
    "from-fuchsia-300 to-violet-500",
    "from-stone-200 to-zinc-500",
    "from-red-300 to-rose-500",
  ];
  const hash = address.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function messageInitial(address: string) {
  const first = address.replace(/[^a-zA-Z0-9]/g, "").charAt(0);
  return first ? first.toUpperCase() : "#";
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
  const latestMessage = allMessages.at(-1);

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
    <main className="min-h-screen overflow-hidden bg-[#101217] text-[#f5f2e8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,180,91,0.14),transparent_30%),radial-gradient(circle_at_84%_18%,rgba(61,214,196,0.12),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-[14px] border border-white/15 bg-[#f5f2e8] text-lg font-black text-[#101217] shadow-[6px_6px_0_rgba(0,0,0,0.28)]">
              G
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-normal sm:text-3xl">
                Guestbook
              </h1>
              <p className="text-sm font-medium text-[#a9aa9f]">
                Solana devnet message room
              </p>
            </div>
          </div>

          {hydrated && (
            <div className="wallet-shell [&_.wallet-adapter-button]:!h-11 [&_.wallet-adapter-button]:!rounded-[14px] [&_.wallet-adapter-button]:!border [&_.wallet-adapter-button]:!border-white/15 [&_.wallet-adapter-button]:!bg-[#20242d] [&_.wallet-adapter-button]:!px-4 [&_.wallet-adapter-button]:!text-sm [&_.wallet-adapter-button]:!font-bold [&_.wallet-adapter-button]:!text-[#f5f2e8] [&_.wallet-adapter-button]:!shadow-[4px_4px_0_rgba(0,0,0,0.3)] [&_.wallet-adapter-button]:!transition [&_.wallet-adapter-button:hover]:!translate-x-0.5 [&_.wallet-adapter-button:hover]:!translate-y-0.5 [&_.wallet-adapter-button:hover]:!bg-[#2d3440] [&_.wallet-adapter-button:hover]:!shadow-[2px_2px_0_rgba(0,0,0,0.35)] [&_.wallet-adapter-button-start-icon]:!mr-2">
              <WalletMultiButton />
            </div>
          )}
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col rounded-[20px] border border-white/10 bg-[#171a21]/85 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="border-b border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffcc7a]">
                  Channels
                </p>
                <span className="rounded-full bg-[#2a2f39] px-2.5 py-1 text-xs font-black text-[#f5f2e8]">
                  {allMessages.length}
                </span>
              </div>

              <div className="rounded-[16px] border border-[#3dd6c4]/30 bg-[#1f2a2f] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-[#3dd6c4] text-sm font-black text-[#101217]">
                    #
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">devnet-lobby</p>
                    <p className="truncate text-xs font-medium text-[#a9aa9f]">
                      {latestMessage
                        ? latestMessage.message
                        : "Waiting for the first signature"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8f928a]">
                Recent signers
              </p>

              {allMessages.length === 0 && (
                <div className="rounded-[16px] border border-dashed border-white/15 p-4 text-sm text-[#a9aa9f]">
                  No wallet has left a note yet.
                </div>
              )}

              {allMessages.slice(-6).map((msg) => (
                <div
                  key={msg.pubkey}
                  className="flex items-center gap-3 rounded-[14px] px-2 py-2 transition hover:bg-white/[0.04]"
                >
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${addressColor(
                      msg.author
                    )} text-xs font-black text-white shadow-lg`}
                  >
                    {messageInitial(msg.author)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-bold text-[#f5f2e8]">
                      {truncateAddress(msg.author)}
                    </p>
                    <p className="truncate text-xs font-medium text-[#8f928a]">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="rounded-[16px] bg-[#101217] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8f928a]">
                  Status
                </p>
                <p className="mt-1 text-sm font-bold text-[#f5f2e8]">
                  {connected ? "Wallet connected" : "Read-only mode"}
                </p>
                {myAddress && (
                  <p className="mt-1 truncate font-mono text-xs text-[#a9aa9f]">
                    {truncateAddress(myAddress)}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <section className="flex min-h-[72vh] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#f5f2e8] text-[#171a21] shadow-[0_30px_100px_rgba(0,0,0,0.32)]">
            <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fffaf0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-[#171a21] text-sm font-black text-[#ffcc7a]">
                  #
                </div>
                <div>
                  <h2 className="text-lg font-black">devnet-lobby</h2>
                  <p className="text-sm font-semibold text-[#686a62]">
                    {fetching ? "Syncing messages" : `${allMessages.length} messages on-chain`}
                  </p>
                </div>
              </div>

              <button
                onClick={refetch}
                disabled={fetching}
                className="h-10 rounded-[14px] border border-black/10 bg-white px-4 text-sm font-black text-[#171a21] shadow-[3px_3px_0_rgba(23,26,33,0.16)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_rgba(23,26,33,0.22)] disabled:opacity-50"
              >
                {fetching ? "Syncing" : "Refresh"}
              </button>
            </div>

            <div className="chat-scroll min-h-0 flex-1 space-y-5 overflow-auto bg-[linear-gradient(rgba(23,26,33,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(23,26,33,0.045)_1px,transparent_1px)] bg-[size:28px_28px] px-4 py-6 sm:px-6">
              {fetching && allMessages.length === 0 && (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-20 w-3/4 animate-pulse rounded-[22px] bg-black/10 ${
                        i % 2 === 0 ? "mr-auto" : "ml-auto"
                      }`}
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="mx-auto max-w-md rounded-[18px] border border-red-300 bg-red-50 p-4 text-center">
                  <p className="text-sm font-bold text-red-700">{error}</p>
                  <button
                    onClick={refetch}
                    className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!fetching && allMessages.length === 0 && !error && (
                <div className="mx-auto grid h-full max-w-sm place-items-center text-center">
                  <div>
                    <div className="mx-auto mb-4 grid size-16 place-items-center rounded-[20px] bg-[#171a21] text-2xl font-black text-[#ffcc7a] shadow-[6px_6px_0_rgba(23,26,33,0.18)]">
                      #
                    </div>
                    <p className="text-lg font-black">Quiet room</p>
                    <p className="mt-1 text-sm font-semibold text-[#686a62]">
                      Connect a wallet and put the first message on devnet.
                    </p>
                  </div>
                </div>
              )}

              {allMessages.map((msg) => {
                const isOwn = msg.author === myAddress;
                const isEditing = editingPubkey === msg.pubkey;

                return (
                  <article
                    key={msg.pubkey}
                    className={`flex items-end gap-3 ${
                      isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isOwn && (
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${addressColor(
                          msg.author
                        )} text-sm font-black text-white shadow-md`}
                      >
                        {messageInitial(msg.author)}
                      </div>
                    )}

                    <div
                      className={`max-w-[min(36rem,82%)] ${
                        isOwn ? "items-end" : "items-start"
                      } flex flex-col gap-1`}
                    >
                      <div className="flex items-center gap-2 px-1">
                        <span className="font-mono text-[11px] font-black uppercase tracking-[0.08em] text-[#686a62]">
                          {isOwn ? "You" : truncateAddress(msg.author)}
                        </span>
                        {isOwn && (
                          <span className="rounded-full bg-[#3dd6c4]/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#0a756e]">
                            Owner
                          </span>
                        )}
                      </div>

                      <div
                        className={`rounded-[24px] px-4 py-3 shadow-[5px_5px_0_rgba(23,26,33,0.12)] ${
                          isOwn
                            ? "rounded-br-[6px] bg-[#2b3039] text-[#fffaf0]"
                            : "rounded-bl-[6px] border border-black/10 bg-white text-[#171a21]"
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              className="min-h-24 w-full resize-none rounded-[16px] border border-black/10 bg-white p-3 text-sm font-semibold text-[#171a21] outline-none transition focus-visible:ring-2 focus-visible:ring-[#3dd6c4]"
                              maxLength={280}
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              autoFocus
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-[#a9aa9f]">
                                {editInput.length}/280
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingPubkey(null);
                                    setEditInput("");
                                  }}
                                  className="rounded-full bg-black/10 px-4 py-2 text-sm font-black text-[#171a21]"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleUpdate}
                                  disabled={loading || !editInput.trim()}
                                  className="rounded-full bg-[#3dd6c4] px-4 py-2 text-sm font-black text-[#101217] disabled:opacity-50"
                                >
                                  {loading ? "Saving" : "Save"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-relaxed">
                            {msg.message}
                          </p>
                        )}
                      </div>

                      {isOwn && !isEditing && (
                        <div className="flex gap-2 px-1 pt-1">
                          <button
                            onClick={() => startEdit(msg)}
                            className="text-xs font-black uppercase tracking-[0.12em] text-[#686a62] transition hover:text-[#171a21]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="text-xs font-black uppercase tracking-[0.12em] text-[#b44a3f] transition hover:text-[#7c241d] disabled:opacity-50"
                          >
                            {loading ? "Deleting" : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>

                    {isOwn && (
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${addressColor(
                          msg.author
                        )} text-sm font-black text-white shadow-md`}
                      >
                        {messageInitial(msg.author)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="border-t border-black/10 bg-[#fffaf0] p-4 sm:p-5">
              {connected ? (
                <div className="rounded-[22px] border border-black/10 bg-white p-3 shadow-[6px_6px_0_rgba(23,26,33,0.1)]">
                  {myMessage && (
                    <p className="mb-2 line-clamp-1 text-xs font-bold text-[#686a62]">
                      Current message: &ldquo;{myMessage.message}&rdquo;
                    </p>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <textarea
                      className="min-h-20 flex-1 resize-none rounded-[18px] bg-[#f1ecdf] p-4 text-sm font-semibold text-[#171a21] outline-none transition placeholder:text-[#8f928a] focus-visible:ring-2 focus-visible:ring-[#3dd6c4]"
                      placeholder="Write a devnet message..."
                      maxLength={280}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span className="font-mono text-xs font-black text-[#8f928a]">
                        {input.length}/280
                      </span>
                      <button
                        onClick={handleCreate}
                        disabled={loading || !input.trim()}
                        className="h-12 rounded-[16px] bg-[#ffcc7a] px-5 text-sm font-black text-[#171a21] shadow-[4px_4px_0_rgba(23,26,33,0.22)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_rgba(23,26,33,0.26)] disabled:opacity-50"
                      >
                        {loading ? "Sending" : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-[22px] border border-dashed border-black/20 bg-white/70 p-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                  <div>
                    <p className="font-black text-[#171a21]">Posting is locked</p>
                    <p className="text-sm font-semibold text-[#686a62]">
                      Connect your wallet to add your message to the room.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#171a21] px-4 py-2 text-sm font-black text-[#ffcc7a]">
                    Wallet required
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
