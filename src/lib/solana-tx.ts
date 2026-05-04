import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJe1bRS",
);
const USDC_MINT = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
);
const USDC_DECIMALS = 6;

// 4.5% platform fee — matches Stripe fee. Integer basis points avoid float errors.
export const PLATFORM_FEE_BPS = 450;

// Splits a micro-USDC total into seller and platform shares using integer arithmetic.
export function splitMicroUsdc(totalMicroUsdc: bigint): {
  seller: bigint;
  platform: bigint;
} {
  const platform = (totalMicroUsdc * BigInt(PLATFORM_FEE_BPS)) / BigInt(10_000);
  return { seller: totalMicroUsdc - platform, platform };
}

function getUsdcAta(owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

// Creates the ATA if it doesn't exist — idempotent (variant 1 of Associated Token Program).
function createAtaIdempotentInstruction(
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([1]),
  });
}

// SPL Token Transfer instruction (index 3).
function createUsdcTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amountMicroUsdc: bigint,
): TransactionInstruction {
  const data = Buffer.alloc(9);
  data.writeUInt8(3, 0);
  data.writeBigUInt64LE(amountMicroUsdc, 1);
  return new TransactionInstruction({
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    programId: TOKEN_PROGRAM_ID,
    data,
  });
}

// Builds an unsigned USDC transfer transaction for the Action Codes flow.
// Splits payment: 95.5% → seller, 4.5% → platform wallet (PLATFORM_SOLANA_WALLET).
// Buyer is fee payer and sole signer — they sign via Action Codes relay.consume.
export async function buildUsdcTransferTx(params: {
  buyerPublicKey: string;
  sellerPublicKey: string;
  amountUsd: number;
}): Promise<string> {
  const platformWallet = process.env.PLATFORM_SOLANA_WALLET;
  if (!platformWallet) throw new Error("PLATFORM_SOLANA_WALLET must be set");

  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  const buyer = new PublicKey(params.buyerPublicKey);
  const seller = new PublicKey(params.sellerPublicKey);
  const platform = new PublicKey(platformWallet);

  const buyerAta = getUsdcAta(buyer);
  const sellerAta = getUsdcAta(seller);
  const platformAta = getUsdcAta(platform);

  const totalMicroUsdc = BigInt(Math.round(params.amountUsd * 10 ** USDC_DECIMALS));
  const { seller: sellerMicroUsdc, platform: platformMicroUsdc } =
    splitMicroUsdc(totalMicroUsdc);

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = buyer;

  tx.add(createAtaIdempotentInstruction(buyer, sellerAta, seller));
  tx.add(createAtaIdempotentInstruction(buyer, platformAta, platform));
  tx.add(createUsdcTransferInstruction(buyerAta, sellerAta, buyer, sellerMicroUsdc));
  tx.add(createUsdcTransferInstruction(buyerAta, platformAta, buyer, platformMicroUsdc));

  return tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");
}
