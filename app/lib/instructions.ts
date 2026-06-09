import {
    address,
    getProgramDerivedAddress,
    getUtf8Encoder,
    getAddressEncoder,
  } from "@solana/kit";
  
  import { PROGRAM_ID, MESSAGE_SEED } from "./constants";
  
  const DISCRIMINATORS = {
    createMessage: new Uint8Array([234, 159, 7, 241, 215, 17, 188, 237]),
    updateMessage: new Uint8Array([23, 135, 34, 211, 96, 120, 107, 9]),
    deleteMessage: new Uint8Array([198, 99, 22, 204, 200, 165, 54, 138]),
  };
  
  function encodeU64(value: number): Uint8Array {
    const buf = new Uint8Array(8);
    new DataView(buf.buffer).setBigUint64(0, BigInt(value), true);
    return buf;
  }
  
  // Derive PDA from ["message", authority, message_id]
  export async function getMessagePDA(walletAddress: string, messageId: number) {
    const [pda] = await getProgramDerivedAddress({
      programAddress: address(PROGRAM_ID),
      seeds: [
        getUtf8Encoder().encode(MESSAGE_SEED),
        getAddressEncoder().encode(address(walletAddress)),
        encodeU64(messageId),
      ],
    });
    return pda;
  }
  
  function encodeString(str: string): Uint8Array {
    const strBytes = new TextEncoder().encode(str);
    const lenBytes = new Uint8Array(4);
    new DataView(lenBytes.buffer).setUint32(0, strBytes.length, true);
    return new Uint8Array([...lenBytes, ...strBytes]);
  }
  
  export function buildCreateMessageData(messageId: number, message: string): Uint8Array {
    const msgBytes = encodeString(message);
    const idBytes = encodeU64(messageId);
    return new Uint8Array([...DISCRIMINATORS.createMessage, ...idBytes, ...msgBytes]);
  }
  
  export function buildUpdateMessageData(messageId: number, message: string): Uint8Array {
    const msgBytes = encodeString(message);
    const idBytes = encodeU64(messageId);
    return new Uint8Array([...DISCRIMINATORS.updateMessage, ...idBytes, ...msgBytes]);
  }
  
  export function buildDeleteMessageData(messageId: number): Uint8Array {
    const idBytes = encodeU64(messageId);
    return new Uint8Array([...DISCRIMINATORS.deleteMessage, ...idBytes]);
  }