import {
    address,
    getProgramDerivedAddress,
    getUtf8Encoder,
    getAddressEncoder,
    
  } from "@solana/kit";
   
  import { PROGRAM_ID, MESSAGE_SEED } from "./constants";
  
  //   come   from   IDL discriminators
  const DISCRIMINATORS = {
    createMessage: new Uint8Array([234, 159, 7, 241, 215, 17, 188, 237]),
    updateMessage: new Uint8Array([23, 135, 34, 211, 96, 120, 107, 9]),
    deleteMessage: new Uint8Array([198, 99, 22, 204, 200, 165, 54, 138]),
  };
  
  // Derive the PDA for a wallet — deterministic, like a DB primary key
  export async function getMessagePDA(walletAddress: string) {
    const [pda] = await getProgramDerivedAddress({
      programAddress: address(PROGRAM_ID),
      seeds: [
        getUtf8Encoder().encode(MESSAGE_SEED),
        getAddressEncoder().encode(address(walletAddress)),
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
   

  export function buildCreateMessageData(message: string): Uint8Array {
    const msgBytes = encodeString(message);
    return new Uint8Array([...DISCRIMINATORS.createMessage, ...msgBytes]);
  }
  
  export function buildUpdateMessageData(message: string): Uint8Array {
    const msgBytes = encodeString(message);
    return new Uint8Array([...DISCRIMINATORS.updateMessage, ...msgBytes]);
  }
  
  export function buildDeleteMessageData(): Uint8Array {
    return new Uint8Array([...DISCRIMINATORS.deleteMessage]);
  }