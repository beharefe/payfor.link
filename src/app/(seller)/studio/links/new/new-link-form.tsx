"use client";

import { createProduct } from "@payforlink/app/actions/product";
import type { ProductType } from "@payforlink/types/database";
import { useRef } from "react";

const PRICE_PRESETS = [5, 9, 19, 49];
const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "template", label: "Template" },
  { value: "file", label: "File" },
  { value: "access", label: "Access" },
  { value: "service", label: "Service" },
  { value: "dataset", label: "Dataset" },
  { value: "other", label: "Other" },
];

export function NewLinkForm() {
  const priceInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={async (formData: FormData) => {
        const title = formData.get("title")?.toString() ?? "";
        const description = formData.get("description")?.toString() ?? "";
        const destination_url = formData.get("destination_url")?.toString() ?? "";
        const price = Number(formData.get("price"));
        const product_type = (formData.get("product_type")?.toString() ||
          undefined) as ProductType | undefined;

        const result = await createProduct({
          title,
          description,
          destination_url,
          price: Number.isFinite(price) ? price : 3,
          product_type,
        });

        if ("error" in result) {
          const { redirect } = await import("next/navigation");
          redirect(`/studio/links/new?error=${encodeURIComponent(result.error)}`);
        }
      }}
      method="post"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div>
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          name="title"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <div>
        <label htmlFor="destination_url">Destination URL *</label>
        <input
          id="destination_url"
          name="destination_url"
          type="url"
          required
          placeholder="https://..."
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <div>
        <label>Price (USD) * — min $3</label>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.25rem",
            flexWrap: "wrap",
          }}
        >
          {PRICE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                if (priceInputRef.current) priceInputRef.current.value = String(p);
              }}
              style={{ padding: "0.5rem 0.75rem" }}
            >
              ${p}
            </button>
          ))}
        </div>
        <input
          ref={priceInputRef}
          id="price"
          name="price"
          type="number"
          min={3}
          step={0.01}
          required
          defaultValue={5}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <div>
        <label htmlFor="product_type">Product type</label>
        <select
          id="product_type"
          name="product_type"
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <option value="">Auto-detect</option>
          {PRODUCT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        style={{ padding: "0.5rem 1rem", alignSelf: "flex-start" }}
      >
        Create link
      </button>
    </form>
  );
}
