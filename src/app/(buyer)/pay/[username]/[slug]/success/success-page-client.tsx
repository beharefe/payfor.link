"use client";

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
