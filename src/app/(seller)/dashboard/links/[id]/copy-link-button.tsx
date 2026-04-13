"use client";

import { useState } from "react";

const CheckIcon = () => (
  <svg className="size-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CopyIcon = () => (
  <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

export function CopyLinkButton({ url, price }: { url: string; price: number }) {
  const [copied, setCopied] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const appUrl = new URL(url).origin;
  const embedCode = `<script async src="${appUrl}/embed.js"></script>\n<a href="${url}" class="unseal-button">Buy for $${price.toFixed(2)}</a>`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors bg-transparent"
      >
        {copied ? (
          <><CheckIcon /> Copied!</>
        ) : (
          <><CopyIcon /> Copy</>
        )}
      </button>

      <button
        type="button"
        onClick={() => setEmbedOpen(true)}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors bg-transparent"
      >
        <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        Embed
      </button>

      {embedOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setEmbedOpen(false); }}
        >
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground mb-0.5">Embed</p>
                <p className="text-sm text-muted-foreground">Add a buy button to any website or blog.</p>
              </div>
              <button
                type="button"
                onClick={() => setEmbedOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 shrink-0 mt-0.5"
                aria-label="Close"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <pre className="bg-muted rounded-xl px-4 py-3 text-xs font-mono text-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">{embedCode}</pre>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-border rounded-full text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors bg-transparent"
            >
              {codeCopied ? (
                <><CheckIcon /> Copied!</>
              ) : (
                <><CopyIcon /> Copy code</>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
