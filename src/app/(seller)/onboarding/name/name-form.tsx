"use client";

import { saveOnboardingName } from "@unseallink/app/actions/onboarding";
import { useState } from "react";

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")  // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "")       // trim leading/trailing hyphens
    .slice(0, 28) || "";
}

export function NameForm({
  defaultName,
  error,
}: {
  defaultName?: string;
  error?: string;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const handle = toHandle(name);

  const ERROR_MESSAGES: Record<string, string> = {
    name_required: "Name is required.",
    name_too_long: "Name must be 60 characters or less.",
  };

  return (
    <form action={saveOnboardingName} className="flex flex-col gap-3">
      {error && ERROR_MESSAGES[error] && (
        <p className="text-destructive text-sm">{ERROR_MESSAGES[error]}</p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Display name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Templates"
          className="w-full px-4 py-2.5 border border-input rounded-xl text-base outline-none bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring box-border"
        />
        {handle && (
          <p className="text-xs text-muted-foreground mt-1.5">
            Your links will look like:{" "}
            <span className="font-mono text-foreground">
              unseal.link/@{handle}/product-name
            </span>
          </p>
        )}
      </div>
      <button
        type="submit"
        className="px-6 py-3 bg-primary text-primary-foreground border-none rounded-full font-medium text-base cursor-pointer self-start hover:opacity-90 transition-opacity"
      >
        Continue →
      </button>
    </form>
  );
}
