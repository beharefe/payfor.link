"use client";

import { signInWithOtp, verifySellerOtp } from "@unseallink/app/actions/auth";
import { Input } from "@unseallink/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@unseallink/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function EmailForm({ defaultEmail, error }: { defaultEmail?: string; error?: string | null }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await signInWithOtp(formData);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={defaultEmail}
          disabled={isPending}
          className="h-11 rounded-xl text-base"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground border-none rounded-full font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending && <Loader2 className="size-4 animate-spin shrink-0" />}
        {isPending ? "Sending…" : "Send code"}
      </button>
      {error && (
        <p className="text-destructive text-sm text-center">{error}</p>
      )}
    </form>
  );
}

export function OtpForm({
  email,
  resendEmail,
  error,
}: {
  email: string;
  resendEmail: string;
  error?: string | null;
}) {
  const router = useRouter();
  const [isVerifying, startVerify] = useTransition();
  const [isResending, startResend] = useTransition();

  function handleOtpComplete(value: string) {
    if (value.length !== 6) return;
    const formData = new FormData();
    formData.set("email", email);
    formData.set("code", value);
    startVerify(async () => {
      await verifySellerOtp(formData);
    });
  }

  function handleResend() {
    const formData = new FormData();
    formData.set("email", resendEmail);
    startResend(async () => {
      await signInWithOtp(formData);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <input type="hidden" name="email" value={email} />
        <label className="block text-sm font-medium text-foreground mb-4">
          Verification code
        </label>

        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            autoFocus
            autoComplete="one-time-code"
            disabled={isVerifying}
            onComplete={handleOtpComplete}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="size-12 text-lg rounded-l-xl" />
              <InputOTPSlot index={1} className="size-12 text-lg" />
              <InputOTPSlot index={2} className="size-12 text-lg rounded-r-xl" />
            </InputOTPGroup>

            <span className="mx-3 text-muted-foreground text-sm select-none">·</span>

            <InputOTPGroup>
              <InputOTPSlot index={3} className="size-12 text-lg rounded-l-xl" />
              <InputOTPSlot index={4} className="size-12 text-lg" />
              <InputOTPSlot index={5} className="size-12 text-lg rounded-r-xl" />
            </InputOTPGroup>
          </InputOTP>

          {isVerifying && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Verifying…
            </div>
          )}
          {error && !isVerifying && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || isVerifying}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending && <Loader2 className="size-3.5 animate-spin" />}
          {isResending ? "Sending…" : "Resend code"}
        </button>
        <a
          href="/auth"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          Use a different email
        </a>
      </div>
    </div>
  );
}
