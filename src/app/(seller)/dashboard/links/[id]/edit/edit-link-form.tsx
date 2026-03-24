"use client";

import { updateProductAction } from "@unseallink/app/actions/product";
import type { ProductType } from "@unseallink/types/database";
import { useTransition, useRef, useState } from "react";

const PRICE_PRESETS = [9.99, 19, 29, 49];
const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "template", label: "Template" },
  { value: "file", label: "File" },
  { value: "access", label: "Access" },
  { value: "service", label: "Service" },
  { value: "dataset", label: "Dataset" },
  { value: "other", label: "Other" },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_RATIO = 1.5;
const MAX_RATIO = 2.4;

function getImageRatio(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width / img.height);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

type Props = {
  id: string;
  defaultValues: {
    title: string;
    description: string;
    destination_url: string;
    price: number;
    product_type: ProductType | null;
    preview_image_url: string | null;
  };
};

export function EditLinkForm({ id, defaultValues }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    defaultValues.preview_image_url,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const priceInputRef = useRef<HTMLInputElement>(null);
  const prevObjectUrl = useRef<string | null>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (prevObjectUrl.current) {
      URL.revokeObjectURL(prevObjectUrl.current);
      prevObjectUrl.current = null;
    }

    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(defaultValues.preview_image_url);
      setImageError(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG, or WebP images are supported");
      setImageFile(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image must be under 2MB");
      setImageFile(null);
      return;
    }

    try {
      const ratio = await getImageRatio(file);
      if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
        setImageError(
          `Image must be landscape ~1.91:1 (e.g. 1200×630px). Your image: ${ratio.toFixed(2)}:1`,
        );
        setImageFile(null);
        return;
      }
    } catch {
      setImageError("Could not read image dimensions");
      setImageFile(null);
      return;
    }

    setImageError(null);
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    prevObjectUrl.current = objectUrl;
    setImagePreviewUrl(objectUrl);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      if (imageFile) {
        const uploadBody = new FormData();
        uploadBody.append("file", imageFile);

        const res = await fetch("/api/upload-preview", {
          method: "POST",
          body: uploadBody,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Image upload failed. Please try again.");
          return;
        }

        const { url } = await res.json();
        formData.set("preview_image_url", url);
      } else {
        // Keep existing image if no new file selected
        formData.set("preview_image_url", defaultValues.preview_image_url ?? "");
      }

      const result = await updateProductAction(null, formData);
      if (result) setError(result);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <input type="hidden" name="id" value={id} />

      <div>
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="destination_url">Destination URL *</label>
        <input
          id="destination_url"
          name="destination_url"
          type="url"
          required
          defaultValue={defaultValues.destination_url}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label>Price (USD) * — min $9.99</label>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
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
          defaultValue={defaultValues.price}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="preview_image">Preview image</label>
        <p style={{ color: "#6B6B6B", fontSize: "0.8125rem", margin: "0.1rem 0 0.25rem" }}>
          Recommended: 1200×630px (1.91:1). Max 2MB — JPG, PNG, or WebP.
        </p>
        <input
          id="preview_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          style={{ display: "block", marginTop: "0.25rem" }}
        />
        {imagePreviewUrl && (
          <img
            src={imagePreviewUrl}
            alt="Preview"
            style={{
              display: "block",
              marginTop: "0.5rem",
              maxWidth: "300px",
              borderRadius: "8px",
              aspectRatio: "1.91 / 1",
              objectFit: "cover",
            }}
          />
        )}
        {imageError && (
          <p style={{ color: "red", fontSize: "0.8125rem", marginTop: "0.25rem" }}>{imageError}</p>
        )}
      </div>

      <div>
        <label htmlFor="product_type">Product type</label>
        <select
          id="product_type"
          name="product_type"
          defaultValue={defaultValues.product_type ?? ""}
          style={{ display: "block", width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
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
        disabled={isPending}
        style={{ padding: "0.5rem 1rem", alignSelf: "flex-start" }}
      >
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
