"use client";

import { createProductAction } from "@unseallink/app/actions/product";
import type { ProductType } from "@unseallink/types/database";
import { useActionState, useRef } from "react";

const PRICE_PRESETS = [9.99, 19, 29, 49];
const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "template", label: "Template" },
  { value: "file", label: "File" },
  { value: "access", label: "Access" },
  { value: "service", label: "Service" },
  { value: "dataset", label: "Dataset" },
  { value: "other", label: "Other" },
];

export function NewLinkForm() {
  const [error, formAction] = useActionState(createProductAction, null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
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
        <label>Price (USD) * — min $9.99</label>
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
          min={9.99}
          step={0.01}
          required
          defaultValue={9.99}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginTop: "0.25rem",
          }}
        />
      </div>
      <div>
        <label htmlFor="preview_image_url">Preview image URL</label>
        <p style={{ color: "#6B6B6B", fontSize: "0.8125rem", margin: "0.1rem 0 0.25rem" }}>
          Used on your paywall page and social shares. Paste a direct image link (https://).
        </p>
        <input
          id="preview_image_url"
          name="preview_image_url"
          type="url"
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
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        type="submit"
        style={{ padding: "0.5rem 1rem", alignSelf: "flex-start" }}
      >
        Create link
      </button>
    </form>
  );
}
