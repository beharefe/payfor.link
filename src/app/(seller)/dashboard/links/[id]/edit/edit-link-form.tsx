"use client";

import { updateProductAction } from "@unseallink/app/actions/product";
import { useRef, useState, useTransition } from "react";

const PRICE_PRESETS = [9.99, 19, 29, 49];

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
    preview_image_url: string | null;
    expires_at: string | null;
  };
};

function formatExpiryPreview(value: string): string {
  const ms = new Date(value).getTime() - Date.now();
  if (ms <= 0) return "";
  const hours = Math.floor(ms / 3600000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 24) return "1 day";
  if (hours > 1) return `${hours} hours`;
  return "less than an hour";
}

export function EditLinkForm({ id, defaultValues }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    defaultValues.preview_image_url,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>(
    defaultValues.expires_at ? new Date(defaultValues.expires_at).toISOString().slice(0, 16) : ""
  );
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
      // Convert datetime-local (local time, no tz) to UTC ISO string so DB stores the correct time
      if (expiresAt) {
        formData.set("expires_at", new Date(expiresAt).toISOString());
      }

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
        formData.set(
          "preview_image_url",
          defaultValues.preview_image_url ?? "",
        );
      }

      const result = await updateProductAction(null, formData);
      if (result) setError(result);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="id" value={id} />

      <div>
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          className="block w-full px-2 py-2 mt-1 border border-input bg-background text-foreground rounded"
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description}
          className="block w-full px-2 py-2 mt-1 border border-input bg-background text-foreground rounded"
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
          className="block w-full px-2 py-2 mt-1 border border-input bg-background text-foreground rounded"
        />
      </div>

      <div>
        <label>Price (USD), min $9.99 *</label>
        <div className="flex gap-2 mt-1 flex-wrap">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                if (priceInputRef.current)
                  priceInputRef.current.value = String(p);
              }}
              className="px-3 py-2 cursor-pointer"
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
          className="block w-full px-2 py-2 mt-1 border border-input bg-background text-foreground rounded"
        />
      </div>

      <div>
        <label htmlFor="preview_image">Preview image</label>
        <p className="text-muted-foreground text-[0.8125rem] mt-[0.1rem] mb-1">
          Recommended: 1200×630px (1.91:1). Max 2MB. JPG, PNG, or WebP.
        </p>
        <input
          id="preview_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="block mt-1"
        />
        {imagePreviewUrl && (
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="block mt-2 max-w-[300px] rounded-lg object-cover [aspect-ratio:1.91/1]"
          />
        )}
        {imageError && (
          <p className="text-destructive text-[0.8125rem] mt-1">
            {imageError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="expires_at">Expiry date <span className="text-muted-foreground font-normal">(optional)</span></label>
        <p className="text-muted-foreground text-[0.8125rem] mt-[0.1rem] mb-1">
          Link stops accepting payments after this date.
        </p>
        <input
          id="expires_at"
          name="expires_at"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="block w-full px-2 py-2 mt-1 border border-input bg-background text-foreground rounded"
        />
        {expiresAt && formatExpiryPreview(expiresAt) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            Your link will show a "Limited offer" badge with {formatExpiryPreview(expiresAt)} remaining.
          </p>
        )}
      </div>

      {error && <p className="text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 self-start cursor-pointer"
      >
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
