"use client";

import { saveOnboardingName } from "@unseallink/app/actions/onboarding";
import { useState } from "react";

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28) || "";
}

const ERROR_MESSAGES: Record<string, string> = {
  name_required: "Name is required.",
  name_too_long: "Name must be 60 characters or less.",
  name_taken: "That name is already taken. Try a different one.",
  save_failed: "Could not save your name. Please try again.",
};

export function NameForm({
  defaultName,
  error,
  detail,
}: {
  defaultName?: string;
  error?: string;
  detail?: string;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [agreed, setAgreed] = useState(false);
  const handle = toHandle(name);

  return (
    <form action={saveOnboardingName} className="flex flex-col gap-4">
      {error && (
        <p className="text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-xl">
          {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          {detail && (
            <span className="block mt-1 text-xs font-mono opacity-70 break-all">
              {decodeURIComponent(detail)}
            </span>
          )}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="name">
          Display name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Templates"
          className="w-full px-4 py-3 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />
        {handle && (
          <p className="text-xs text-muted-foreground mt-2">
            Your URL:{" "}
            <span className="font-mono text-foreground">
              unseal.link/@{handle}/…
            </span>
          </p>
        )}
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 shrink-0 accent-primary"
        />
        <span className="text-sm text-muted-foreground leading-snug">
          I agree to the{" "}
          <a href="/terms" target="_blank" className="underline text-foreground hover:opacity-70">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" className="underline text-foreground hover:opacity-70">
            Privacy Policy
          </a>
        </span>
      </label>
      <button
        type="submit"
        disabled={!agreed}
        className="w-full py-3 bg-primary text-primary-foreground border-none rounded-full font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start selling →
      </button>
    </form>
  );
}
