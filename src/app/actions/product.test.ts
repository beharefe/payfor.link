import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProduct } from "./product";

// Mock dependencies
vi.mock("@payforlink/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@payforlink/lib/logger", () => ({
  log: { error: vi.fn(), info: vi.fn() },
}));
vi.mock("slugify", () => ({
  default: vi.fn((str: string) =>
    str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
  ),
}));

import { createClient } from "@payforlink/lib/supabase/server";

const mockUser = { id: "user-123", email: "seller@test.com" };

function makeSupabaseMock({
  user = mockUser,
  stripeConnected = false,
  insertedLink = { id: "link-abc" },
  existingSlug = null as string | null,
} = {}) {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: existingSlug ? { id: "existing" } : null });
  const insertSelect = vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({ data: insertedLink, error: null }),
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "links") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue(insertSelect()),
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { stripe_connected: stripeConnected },
              }),
            }),
          }),
        };
      }
    }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createProduct — validation", () => {
  it("returns error when not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const result = await createProduct({
      title: "My Template",
      description: "",
      destination_url: "https://notion.so/page",
      price: 10,
    });

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("returns error when title is empty", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock(),
    );

    const result = await createProduct({
      title: "  ",
      description: "",
      destination_url: "https://notion.so/page",
      price: 10,
    });

    expect(result).toEqual({ error: "Title is required" });
  });

  it("returns error when URL is empty", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock(),
    );

    const result = await createProduct({
      title: "My Template",
      description: "",
      destination_url: "  ",
      price: 10,
    });

    expect(result).toEqual({ error: "URL is required" });
  });

  it("returns error when price is below minimum", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabaseMock(),
    );

    const result = await createProduct({
      title: "My Template",
      description: "",
      destination_url: "https://notion.so/page",
      price: 1,
    });

    expect(result).toEqual({ error: "Minimum price is $3" });
  });
});

describe("createProduct — status", () => {
  it("sets status to draft when seller has no Stripe connected", async () => {
    const mock = makeSupabaseMock({ stripeConnected: false });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mock);

    // redirect throws, so we catch it
    await expect(
      createProduct({
        title: "My Template",
        description: "A great template",
        destination_url: "https://notion.so/page",
        price: 10,
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/studio/links/link-abc");
  });
});
