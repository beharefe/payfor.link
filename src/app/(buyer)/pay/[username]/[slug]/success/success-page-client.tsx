"use client";

import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SuccessPoller() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <p className="text-muted-foreground mt-4">
      Confirming your payment, please wait…
    </p>
  );
}

export function ConfettiOnMount() {
  useEffect(() => {
    // Short delay so the page renders first
    const t = setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.55 },
        colors: ["#111111", "#6B6B6B", "#F5F4EF", "#1A7A4A", "#635BFF"],
        scalar: 0.9,
      });
    }, 300);
    return () => clearTimeout(t);
  }, []);
  return null;
}
