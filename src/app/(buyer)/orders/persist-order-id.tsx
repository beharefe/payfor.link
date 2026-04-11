"use client";

import { useEffect } from "react";

export function PersistOrderId({ oid }: { oid: string }) {
  useEffect(() => {
    localStorage.setItem("last_order_id", oid);
  }, [oid]);
  return null;
}
