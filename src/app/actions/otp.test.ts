import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resendOtp, verifyOtp } from "./otp";

// redirect() throws in Next.js — simulate that so execution stops as expected
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw Object.assign(new Error(`NEXT_REDIRECT:${url}`), {
      digest: "NEXT_REDIRECT",
    });
  }),
}));
vi.mock("@unseallink/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));
vi.mock("@unseallink/lib/resend", () => ({
  resend: {
    emails: { send: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
  FROM_EMAIL: "noreply@unseal.link",
}));
vi.mock("@unseallink/lib/logger", () => ({
  log: { error: vi.fn(), info: vi.fn() },
}));

import { createServiceClient } from "@unseallink/lib/supabase/server";
import { redirect } from "next/navigation";

const VALID_CODE = "123456";
const VALID_HASH = crypto.createHash("sha256").update(VALID_CODE).digest("hex");
const FUTURE_DATE = new Date(Date.now() + 15 * 60 * 1000).toISOString();
const PAST_DATE = new Date(Date.now() - 1000).toISOString();

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    buyer_email: "buyer@test.com",
    buyer_email_verified: false,
    delivery_url: "https://notion.so/secret-page",
    product_title: "My Template",
    otp_hash: VALID_HASH,
    otp_expires_at: FUTURE_DATE,
    ...overrides,
  };
}

function makeSupabaseMock(order: ReturnType<typeof makeOrder> | null) {
  const updateEqFn = vi.fn().mockResolvedValue({ error: null });
  const updateFn = vi.fn().mockReturnValue({ eq: updateEqFn });
  const insertFn = vi.fn().mockResolvedValue({ error: null });

  const mock = {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: order }),
        }),
      }),
      update: updateFn,
      insert: insertFn,
    })),
    _updateFn: updateFn,
    _updateEqFn: updateEqFn,
    _insertFn: insertFn,
  };
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "https://unseal.link";
});

describe("verifyOtp", () => {
  it("returns error when order not found", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(null),
    );

    const result = await verifyOtp("bad-id", VALID_CODE);
    expect(result).toEqual({ error: "Order not found" });
  });

  it("redirects to order page when already verified", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(makeOrder({ buyer_email_verified: true })),
    );

    await expect(verifyOtp("order-1", VALID_CODE)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(redirect).toHaveBeenCalledWith("/orders/order-1");
  });

  it("returns error when no otp_hash on order", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(makeOrder({ otp_hash: null, otp_expires_at: null })),
    );

    const result = await verifyOtp("order-1", VALID_CODE);
    expect(result).toEqual({
      error: "No verification code found. Request a new one.",
    });
  });

  it("returns error when code is expired", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(makeOrder({ otp_expires_at: PAST_DATE })),
    );

    const result = await verifyOtp("order-1", VALID_CODE);
    expect(result).toEqual({ error: "Code expired. Request a new one." });
  });

  it("returns error when code does not match hash", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(makeOrder()),
    );

    const result = await verifyOtp("order-1", "000000");
    expect(result).toEqual({
      error: "Invalid code. Check your email and try again.",
    });
  });

  it("trims whitespace from code before hashing", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(makeOrder()),
    );

    // Should succeed — same code with leading/trailing spaces
    await expect(verifyOtp("order-1", `  ${VALID_CODE}  `)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
  });

  it("marks order verified, clears OTP fields, inserts access token, sends email, redirects", async () => {
    const mock = makeSupabaseMock(makeOrder());
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    await expect(verifyOtp("order-1", VALID_CODE)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    // Clears OTP and marks verified
    expect(mock._updateFn).toHaveBeenCalledWith({
      buyer_email_verified: true,
      otp_hash: null,
      otp_expires_at: null,
    });

    // Access token inserted
    expect(mock._insertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        token_hash: expect.any(String),
        expires_at: expect.any(String),
      }),
    );

    // Unlock email sent to buyer
    const { resend } = await import("@unseallink/lib/resend");
    expect(resend.emails.send).toHaveBeenCalledOnce();
    const [call] = (resend.emails.send as ReturnType<typeof vi.fn>).mock.calls;
    expect(call[0].to).toBe("buyer@test.com");
    expect(call[0].html).toContain("/unlock?token=");
    expect(call[0].html).toContain("My Template");

    expect(redirect).toHaveBeenCalledWith("/orders/order-1");
  });

  it("does not send email when access token insert fails", async () => {
    const mock = makeSupabaseMock(makeOrder());
    mock._insertFn.mockResolvedValue({ error: { message: "DB error" } });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    await expect(verifyOtp("order-1", VALID_CODE)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    const { resend } = await import("@unseallink/lib/resend");
    expect(resend.emails.send).not.toHaveBeenCalled();

    // Still redirects even if email fails
    expect(redirect).toHaveBeenCalledWith("/orders/order-1");
  });
});

describe("resendOtp", () => {
  it("returns error when order not found", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(null),
    );

    const result = await resendOtp("bad-id");
    expect(result).toEqual({ error: "Order not found" });
  });

  it("returns success immediately if already verified without sending email", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSupabaseMock(makeOrder({ buyer_email_verified: true })),
    );

    const result = await resendOtp("order-1");
    expect(result).toEqual({ success: true });

    const { resend } = await import("@unseallink/lib/resend");
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("updates otp_hash and otp_expires_at in DB then sends email", async () => {
    const mock = makeSupabaseMock(makeOrder());
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await resendOtp("order-1");
    expect(result).toEqual({ success: true });

    expect(mock._updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        otp_hash: expect.stringMatching(/^[a-f0-9]{64}$/), // SHA-256 hex
        otp_expires_at: expect.any(String),
      }),
    );

    const { resend } = await import("@unseallink/lib/resend");
    expect(resend.emails.send).toHaveBeenCalledOnce();
    const [call] = (resend.emails.send as ReturnType<typeof vi.fn>).mock.calls;
    expect(call[0].to).toBe("buyer@test.com");
    expect(call[0].html).toMatch(/\b\d{6}\b/); // 6-digit code in email body
  });

  it("otp_expires_at is ~15 minutes in the future", async () => {
    const mock = makeSupabaseMock(makeOrder());
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const before = Date.now();
    await resendOtp("order-1");
    const after = Date.now();

    const [[updateArg]] = mock._updateFn.mock.calls;
    const expiresAt = new Date(updateArg.otp_expires_at).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 14 * 60 * 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + 15 * 60 * 1000 + 1000);
  });

  it("returns error and skips email when DB update fails", async () => {
    const mock = makeSupabaseMock(makeOrder());
    mock._updateFn.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const result = await resendOtp("order-1");
    expect(result).toEqual({ error: "Failed to send code. Please try again." });

    const { resend } = await import("@unseallink/lib/resend");
    expect(resend.emails.send).not.toHaveBeenCalled();
  });

  it("returns error when email send fails", async () => {
    const mock = makeSupabaseMock(makeOrder());
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mock);

    const { resend } = await import("@unseallink/lib/resend");
    (resend.emails.send as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: null,
      error: { message: "Email provider error" },
    });

    const result = await resendOtp("order-1");
    expect(result).toEqual({ error: "Failed to send code. Please try again." });
  });
});
