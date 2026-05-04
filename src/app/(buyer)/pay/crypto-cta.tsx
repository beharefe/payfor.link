"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletName, SolflareWalletName, CoinbaseWalletName } from "@solana/wallet-adapter-wallets";
import { createTransfer, type Amount } from "@solana/pay";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, createTransferInstruction, createAssociatedTokenAccountIdempotentInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BigNumber from "bignumber.js";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRef, useState, useMemo } from "react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { PLATFORM_FEE_BPS, splitMicroUsdc } from "@unseallink/lib/solana-tx";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_SOLANA_WALLET ?? "";

type Step = "collapsed" | "email" | "connecting" | "ready" | "confirming" | "done";

const WALLET_OPTIONS: { name: WalletName; label: string }[] = [
  { name: PhantomWalletName, label: "Phantom" },
  { name: SolflareWalletName, label: "Solflare" },
  { name: CoinbaseWalletName, label: "Coinbase" },
];

const SolanaIcon = () => (
  <svg viewBox="0 0 128 128" className="h-4 w-4 shrink-0" aria-hidden="true">
    <defs>
      <linearGradient id="sol-g" x1="0" y1="96" x2="128" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#9945FF" />
        <stop offset="0.5" stopColor="#43B4CA" />
        <stop offset="1" stopColor="#19FB9B" />
      </linearGradient>
    </defs>
    <path d="M108.53 75.69L90.81 94.69C90.43 95.1 89.96 95.43 89.45 95.66C88.93 95.88 88.37 96 87.81 96H3.81C3.41 96 3.02 95.88 2.68 95.66C2.35 95.44 2.08 95.13 1.92 94.76C1.76 94.4 1.71 93.99 1.78 93.6C1.85 93.2 2.03 92.83 2.3 92.54L20 73.54C20.38 73.13 20.85 72.8 21.36 72.57C21.88 72.35 22.44 72.23 23 72.23H107C107.4 72.22 107.8 72.33 108.14 72.55C108.48 72.77 108.75 73.08 108.92 73.45C109.08 73.82 109.13 74.23 109.06 74.63C108.99 75.03 108.81 75.39 108.53 75.69ZM90.81 37.42C90.43 37.01 89.96 36.68 89.45 36.46C88.93 36.23 88.37 36.11 87.81 36.11H3.81C3.41 36.11 3.02 36.23 2.68 36.45C2.35 36.67 2.08 36.98 1.92 37.35C1.76 37.71 1.71 38.12 1.78 38.51C1.85 38.91 2.03 39.28 2.3 39.57L20 58.58C20.38 58.99 20.85 59.32 21.36 59.54C21.88 59.77 22.44 59.89 23 59.89H107C107.4 59.89 107.79 59.77 108.12 59.55C108.46 59.33 108.72 59.02 108.88 58.65C109.04 58.28 109.09 57.88 109.02 57.48C108.95 57.09 108.77 56.72 108.5 56.43L90.81 37.42ZM3.81 23.77H87.81C88.37 23.77 88.93 23.65 89.45 23.43C89.96 23.2 90.43 22.87 90.81 22.46L108.53 3.46C108.81 3.17 108.99 2.8 109.06 2.4C109.13 2 109.08 1.59 108.92 1.22C108.75 0.85 108.48 0.54 108.14 0.32C107.8 0.1 107.4 -0.01 107 0H23C22.44 0 21.88 0.12 21.36 0.34C20.85 0.57 20.38 0.9 20 1.31L2.3 20.31C2.03 20.6 1.85 20.97 1.78 21.37C1.71 21.76 1.76 22.17 1.92 22.53C2.08 22.9 2.35 23.21 2.68 23.43C3.02 23.65 3.41 23.77 3.81 23.77Z" fill="url(#sol-g)" />
  </svg>
);

export function CryptoCTA({
  linkId,
  price,
  sellerWallet,
}: {
  linkId: string;
  price: number;
  sellerWallet: string;
}) {
  const { connection } = useConnection();
  const { select, connect, connected, publicKey, sendTransaction } = useWallet();

  const [step, setStep] = useState<Step>("collapsed");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fresh reference keypair per mount — uniquely identifies this payment attempt on-chain.
  const reference = useMemo(() => Keypair.generate().publicKey, []);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 4)}…${addr.slice(-4)}`;

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("A valid email address is required");
      return;
    }
    setError(null);
    setStep("connecting");
  }

  async function handleWalletSelect(name: WalletName) {
    setError(null);
    try {
      select(name);
      // connect() fires after select resolves; wallet adapter handles the async flow.
      await connect();
      setStep("ready");
    } catch {
      setError("Could not connect wallet. Try again.");
    }
  }

  async function handlePay() {
    if (!publicKey || !sellerWallet) return;
    setError(null);
    setStep("confirming");

    let txSignature: string;
    try {
      const USDC_DECIMALS = 6;
      const totalMicroUsdc = BigInt(Math.round(price * 10 ** USDC_DECIMALS));
      const { seller: sellerMicroUsdc, platform: platformMicroUsdc } =
        splitMicroUsdc(totalMicroUsdc);

      // createTransfer builds the seller leg with the reference key for on-chain tracking.
      // biome-ignore lint/suspicious/noExplicitAny: BigNumber type conflict between bignumber.js and @solana/pay's nested copy
      const sellerAmount = new BigNumber(sellerMicroUsdc.toString()).dividedBy(10 ** USDC_DECIMALS) as unknown as Amount;
      const transaction = await createTransfer(connection, publicKey, {
        recipient: new PublicKey(sellerWallet),
        amount: sellerAmount,
        splToken: USDC_MINT,
        reference,
        memo: `unseal:${linkId}`,
      });

      // Append 4.5% platform fee leg to the same atomic transaction.
      if (PLATFORM_WALLET && platformMicroUsdc > 0n) {
        const platform = new PublicKey(PLATFORM_WALLET);
        const buyerAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        const platformAta = getAssociatedTokenAddressSync(USDC_MINT, platform);
        (transaction as Transaction).add(
          createAssociatedTokenAccountIdempotentInstruction(publicKey, platformAta, platform, USDC_MINT),
          createTransferInstruction(buyerAta, platformAta, publicKey, platformMicroUsdc, [], TOKEN_PROGRAM_ID),
        );
      }

      txSignature = await sendTransaction(transaction as Transaction, connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed. Try again.");
      setStep("ready");
      return;
    }

    // Poll until the server confirms and creates the order.
    const poll = async (): Promise<void> => {
      const params = new URLSearchParams({
        txSignature,
        linkId,
        email: email.trim().toLowerCase(),
        reference: reference.toBase58(),
      });
      const res = await fetch(`/api/solana-confirm?${params.toString()}`);
      if (!res.ok) {
        setError("Payment sent but confirmation failed. Check your email for access.");
        setStep("done");
        return;
      }
      const data = (await res.json()) as { status: string; orderId?: string };
      if (data.status === "complete" && data.orderId) {
        window.location.href = `/orders/${data.orderId}`;
        return;
      }
      // Still pending — wait 2s and retry.
      await new Promise((r) => setTimeout(r, 2000));
      return poll();
    };

    try {
      await poll();
    } catch {
      setError("Payment sent but confirmation failed. Check your email for access.");
      setStep("done");
    }
  }

  if (step === "collapsed") {
    return (
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        <SolanaIcon />
        Pay with Solana
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      {step === "email" && (
        <form onSubmit={handleEmailSubmit}>
          <div className="relative">
            <input
              ref={inputRef}
              type="email"
              required
              autoFocus
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-4 pr-12 py-2.5 border border-input rounded-full text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
            />
            <button
              type="submit"
              aria-label="Continue"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background hover:opacity-80 transition-opacity"
            >
              <ArrowRight className="size-4 shrink-0" />
            </button>
          </div>
          {error && <p className="text-destructive text-xs px-1">{error}</p>}
        </form>
      )}

      {step === "connecting" && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground px-1">Choose your wallet</p>
          <div className="flex flex-col gap-1.5">
            {WALLET_OPTIONS.map(({ name, label }) => (
              <button
                key={name}
                type="button"
                onClick={() => handleWalletSelect(name)}
                className="w-full py-2.5 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          {error && <p className="text-destructive text-xs px-1">{error}</p>}
        </div>
      )}

      {step === "ready" && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={handlePay}
            className="w-full py-2.5 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Pay ${price.toFixed(2)} USDC
          </button>
          {publicKey && (
            <p className="text-xs text-muted-foreground text-center">
              {truncateAddress(publicKey.toBase58())}
            </p>
          )}
          {error && <p className="text-destructive text-xs px-1">{error}</p>}
        </div>
      )}

      {step === "confirming" && (
        <div className="w-full py-2.5 border border-border rounded-full flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin size-4 shrink-0" />
          Confirming on Solana…
        </div>
      )}

      {step === "done" && (
        <div className="w-full py-2.5 border border-border rounded-full text-center text-sm text-muted-foreground">
          {error ?? "Redirecting…"}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setStep("collapsed");
          setError(null);
          setEmail("");
        }}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
      >
        Cancel
      </button>
    </div>
  );
}
