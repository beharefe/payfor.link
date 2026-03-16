import { beforeEach, describe, expect, it, vi } from "vitest";
import { resendOtp, verifyOtp } from "./otp";

vi.mock("@payforlink/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));
vi.mock("@payforlink/lib/resend", () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
  FROM_EMAIL: "noreply@payfor.link",
}));
vi.mock("@payforlink/lib/logger", () => ({
  log: { error: vi.fn(), info: vi.fn() },
}));

import { createServiceClient } from "@payforlink/lib/supabase/server";

function makePurchase(overrides: Record<string, unknown> = {}) {
  return {
    id: "purchase-1",
    buyer_email: "buyer@test.com",
    buyer_email_verified: false,
    delivery_url: "https://notion.so/secret-page",
    product_title: "My Template",
    ...overrides,
  };
}

function makeSupabaseMock(
  purchase: ReturnType<typeof makePurchase>,
  auth = { verifyOtp: vi.fn(), signInWithOtp: vi.fn() },
) {
  const updateFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const insertFn = vi.fn().mockResolvedValue({ error: null });

  return {
    auth,
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: purchase }),
        }),
      }),
      update: updateFn,
      insert: insertFn,
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifyOtp", () => {
  it("returns error when purchase not found", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { verifyOtp: vi.fn() },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    });

    const result = await verifyOtp("bad-id", "123456");
    expect(result).toEqual({ error: "Purchase not found" });
  });

  it("returns success immediately if already verified", async () => {
    const mock = makeSupabaseMock(makePurchase({ buyer_email_verified: true }));
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await verifyOtp("purchase-1", "123456");
    expect(result).toEqual({ success: true });
    expect(mock.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("returns error when Supabase OTP is expired", async () => {
    const mock = makeSupabaseMock(makePurchase());
    mock.auth.verifyOtp.mockResolvedValue({
      error: { message: "Token has expired" },
    });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await verifyOtp("purchase-1", "123456");
    expect(result).toEqual({ error: "Code expired. Request a new one." });
  });

  it("returns error on wrong code", async () => {
    const mock = makeSupabaseMock(makePurchase());
    mock.auth.verifyOtp.mockResolvedValue({
      error: { message: "Invalid OTP" },
    });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await verifyOtp("purchase-1", "000000");
    expect(result).toEqual(
      expect.objectContaining({ error: expect.stringMatching(/invalid/i) }),
    );
  });

  it("returns success and sends unlock email on correct code", async () => {
    const mock = makeSupabaseMock(makePurchase());
    mock.auth.verifyOtp.mockResolvedValue({ data: {}, error: null });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);
    process.env.NEXT_PUBLIC_APP_URL = "https://payfor.link";

    const result = await verifyOtp("purchase-1", "123456");
    expect(result).toEqual({ success: true });

    expect(mock.auth.verifyOtp).toHaveBeenCalledWith({
      email: "buyer@test.com",
      token: "123456",
      type: "email",
    });

    const { resend } = await import("@payforlink/lib/resend");
    expect(resend.emails.send).toHaveBeenCalledOnce();
  });
});

describe("resendOtp", () => {
  it("returns error when purchase not found", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { signInWithOtp: vi.fn() },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    });

    const result = await resendOtp("bad-id");
    expect(result).toEqual({ error: "Purchase not found" });
  });

  it("returns success immediately if already verified", async () => {
    const mock = makeSupabaseMock(makePurchase({ buyer_email_verified: true }));
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await resendOtp("purchase-1");
    expect(result).toEqual({ success: true });
    expect(mock.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("sends OTP via Supabase and returns success", async () => {
    const mock = makeSupabaseMock(makePurchase());
    mock.auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await resendOtp("purchase-1");
    expect(result).toEqual({ success: true });

    expect(mock.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "buyer@test.com",
      options: { shouldCreateUser: true },
    });
    // Unlock email is not sent on resend — Supabase sends the OTP email
    const { resend } = await import("@payforlink/lib/resend");
    expect(resend.emails.send).not.toHaveBeenCalled();
  });
});
