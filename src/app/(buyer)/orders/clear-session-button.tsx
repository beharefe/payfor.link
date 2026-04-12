"use client";

export function ClearSessionButton() {
  function handleClear() {
    localStorage.removeItem("last_order_id");
    window.location.href = "/orders";
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0 underline underline-offset-2"
    >
      Sign out
    </button>
  );
}
