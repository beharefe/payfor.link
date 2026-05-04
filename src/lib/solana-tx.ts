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

// Derives the Associated Token Account address for (owner, USDC mint).
function getUsdcAta(owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

// Creates the ATA if it doesn't exist yet — idempotent, safe to include always.
// Uses instruction variant 1 (CreateIdempotent) from the Associated Token Program v1.0.5+.
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

// SPL Token Transfer instruction (instruction index 3).
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

// Builds an unsigned, serialized USDC transfer transaction from buyer → seller.
// The buyer is the fee payer and sole signer — they sign via Action Codes.
// Returns a base64-encoded serialized Transaction ready for relay.consume.
export async function buildUsdcTransferTx(params: {
  buyerPublicKey: string;
  sellerPublicKey: string;
  amountUsd: number;
}): Promise<string> {
  const rpcUrl =
    process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  const buyer = new PublicKey(params.buyerPublicKey);
  const seller = new PublicKey(params.sellerPublicKey);

  const buyerAta = getUsdcAta(buyer);
  const sellerAta = getUsdcAta(seller);

  const amountMicroUsdc = BigInt(
    Math.round(params.amountUsd * 10 ** USDC_DECIMALS),
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = buyer;

  // Ensure seller's USDC account exists — idempotent, no-op if already created.
  tx.add(createAtaIdempotentInstruction(buyer, sellerAta, seller));
  tx.add(createUsdcTransferInstruction(buyerAta, sellerAta, buyer, amountMicroUsdc));

  return tx
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString("base64");
}
