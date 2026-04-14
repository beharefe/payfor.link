"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function DashboardPoller() {
  const router = useRouter();
  const params = useSearchParams();

  // Show toast and clean URL after Stripe connect redirect
  useEffect(() => {
    if (params.get("stripe") === "connected") {
      toast.success("Payouts set up!", {
        description: "Your bank account is connected. Your links are now live.",
        duration: 6000,
      });
      // Remove the param from the URL without a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("stripe");
      window.history.replaceState({}, "", url.toString());
    }
  }, [params]);

  // Soft-refresh server components every 30s
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
