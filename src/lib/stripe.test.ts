import { describe, expect, it } from "vitest";
import { PLATFORM_FEE_PERCENT, platformFeeCents } from "./stripe";

describe("platformFeeCents", () => {
  it("calculates 4.5% fee correctly for common amounts", () => {
    expect(platformFeeCents(20)).toBe(90); // $20 × 4.5% = $0.90 → 90 cents
    expect(platformFeeCents(10)).toBe(45); // $10 × 4.5% = $0.45 → 45 cents
    expect(platformFeeCents(100)).toBe(450);
  });

  it("rounds to nearest cent", () => {
    // $3 × 4.5% = $0.135 → rounds to 14 cents
    expect(platformFeeCents(3)).toBe(14);
  });

  it("matches the documented platform fee percentage", () => {
    expect(PLATFORM_FEE_PERCENT).toBe(0.045);
  });

  it("never returns a negative fee", () => {
    expect(platformFeeCents(0)).toBe(0);
  });
});
