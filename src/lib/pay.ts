import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { type PaymentAsset, SOLANA_RPC_URL } from "./web3-config";

export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}

// Native SOL balance (in SOL) for a wallet.
export async function getSolBalance(connection: Connection, owner: PublicKey): Promise<number> {
  const lamports = await connection.getBalance(owner);
  return lamports / LAMPORTS_PER_SOL;
}

// Balance of the asset the user is paying with (SOL or an SPL token).
export async function getAssetBalance(
  connection: Connection,
  owner: PublicKey,
  asset: PaymentAsset
): Promise<number> {
  if (asset.kind === "native") {
    return getSolBalance(connection, owner);
  }
  const mint = new PublicKey(asset.mint as string);
  const ata = await getAssociatedTokenAddress(mint, owner);
  try {
    const res = await connection.getTokenAccountBalance(ata);
    return res.value.uiAmount ?? 0;
  } catch {
    // No token account yet → zero balance.
    return 0;
  }
}

// Live SOL/USD price so a USD-denominated plan can be paid in SOL.
export async function fetchSolUsdPrice(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
  );
  if (!res.ok) throw new Error("Failed to fetch SOL price");
  const json = await res.json();
  const price = json?.solana?.usd;
  if (!price || typeof price !== "number") throw new Error("Invalid SOL price response");
  return price;
}

// Build an unsigned transfer transaction for SOL (native) or an SPL token
// (USDC / USDT). `uiAmount` is in human units, e.g. 1.5 SOL or 49 USDC.
export async function buildPaymentTransaction(opts: {
  connection: Connection;
  payer: PublicKey;
  recipient: PublicKey;
  asset: PaymentAsset;
  uiAmount: number;
}): Promise<Transaction> {
  const { connection, payer, recipient, asset, uiAmount } = opts;
  const tx = new Transaction();

  if (asset.kind === "native") {
    const lamports = Math.round(uiAmount * LAMPORTS_PER_SOL);
    tx.add(
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: recipient,
        lamports,
      })
    );
  } else {
    const mint = new PublicKey(asset.mint as string);
    const fromAta = await getAssociatedTokenAddress(mint, payer);
    const toAta = await getAssociatedTokenAddress(mint, recipient);

    // Create the recipient's associated token account if it doesn't exist yet
    // (payer covers the rent).
    const toInfo = await connection.getAccountInfo(toAta);
    if (!toInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(payer, toAta, recipient, mint)
      );
    }

    const amount = BigInt(Math.round(uiAmount * 10 ** asset.decimals));
    tx.add(createTransferInstruction(fromAta, toAta, payer, amount));
  }

  tx.feePayer = payer;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  return tx;
}

// Minimal base58 encoder (Privy returns the signature as raw bytes).
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let str = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) str += "1";
  for (let i = digits.length - 1; i >= 0; i--) str += B58[digits[i]];
  return str;
}

// Solscan link for a confirmed transaction.
export function explorerTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}
