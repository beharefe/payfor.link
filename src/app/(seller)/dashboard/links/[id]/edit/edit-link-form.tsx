"use client";

import { updateProductAction } from "@unseallink/app/actions/product";
import { useRef, useState, useTransition } from "react";
import { X } from "lucide-react";

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
    subtitle: string | null;
    includes: string[] | null;
    faq: Array<{ q: string; a: string }> | null;
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

const inputClass =
  "w-full px-4 py-2.5 border border-input rounded-xl bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

const labelClass = "block text-sm font-medium text-foreground mb-1.5";
const hintClass = "text-xs text-muted-foreground mt-1";

export function EditLinkForm({ id, defaultValues }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    defaultValues.preview_image_url,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>(
    defaultValues.expires_at
      ? new Date(defaultValues.expires_at).toISOString().slice(0, 16)
      : "",
  );
  const [subtitle, setSubtitle] = useState(defaultValues.subtitle ?? "");
  const [includes, setIncludes] = useState<string[]>(defaultValues.includes ?? []);
  const [faq, setFaq] = useState<Array<{ q: string; a: string }>>(defaultValues.faq ?? []);
  const [isPending, startTransition] = useTransition();
  const priceInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevObjectUrl = useRef<string | null>(null);

  // Includes helpers
  function addInclude() {
    if (includes.length < 8) setIncludes((prev) => [...prev, ""]);
  }
  function updateInclude(i: number, val: string) {
    setIncludes((prev) => prev.map((item, idx) => (idx === i ? val : item)));
  }
  function removeInclude(i: number) {
    setIncludes((prev) => prev.filter((_, idx) => idx !== i));
  }

  // FAQ helpers
  function addFaqItem() {
    if (faq.length < 5) setFaq((prev) => [...prev, { q: "", a: "" }]);
  }
  function updateFaqItem(i: number, field: "q" | "a", val: string) {
    setFaq((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }
  function removeFaqItem(i: number) {
    setFaq((prev) => prev.filter((_, idx) => idx !== i));
  }

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

      formData.set("subtitle", subtitle);
      formData.set("includes", JSON.stringify(includes.filter((s) => s.trim())));
      formData.set("faq", JSON.stringify(faq.filter((item) => item.q.trim() && item.a.trim())));

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
        formData.set("preview_image_url", defaultValues.preview_image_url ?? "");
      }

      const result = await updateProductAction(null, formData);
      if (result) setError(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={id} />

      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClass}>Title</label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaultValues.title}
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={labelClass}>
          Description{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Tagline / Subtitle */}
      <div>
        <label htmlFor="subtitle" className={labelClass}>
          Tagline{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </label>
        <input
          id="subtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={120}
          placeholder="One-line summary shown under the title on the paywall"
          className={inputClass}
        />
        <p className={hintClass}>{subtitle.length}/120</p>
      </div>

      {/* What's included */}
      <div>
        <p className={labelClass}>
          What&apos;s included{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </p>
        <p className={`${hintClass} mb-3`}>Up to 8 bullet points shown on the paywall page.</p>
        <div className="flex flex-col gap-2">
          {includes.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional list
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => updateInclude(i, e.target.value)}
                maxLength={120}
                placeholder={`Item ${i + 1}`}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeInclude(i)}
                className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remove item"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        {includes.length < 8 && (
          <button
            type="button"
            onClick={addInclude}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            + Add item
          </button>
        )}
      </div>

      {/* FAQ */}
      <div>
        <p className={labelClass}>
          FAQ{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </p>
        <p className={`${hintClass} mb-3`}>Up to 5 Q&amp;A pairs shown on the paywall page.</p>
        <div className="flex flex-col gap-4">
          {faq.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional list
            <div key={i} className="border border-border rounded-xl p-4 space-y-2.5 relative">
              <button
                type="button"
                onClick={() => removeFaqItem(i)}
                className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remove FAQ item"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Question</label>
                <input
                  type="text"
                  value={item.q}
                  onChange={(e) => updateFaqItem(i, "q", e.target.value)}
                  placeholder="e.g. Can I use this commercially?"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Answer</label>
                <textarea
                  value={item.a}
                  onChange={(e) => updateFaqItem(i, "a", e.target.value)}
                  rows={2}
                  placeholder="Your answer…"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          ))}
        </div>
        {faq.length < 5 && (
          <button
            type="button"
            onClick={addFaqItem}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            + Add question
          </button>
        )}
      </div>

      {/* Destination URL */}
      <div>
        <label htmlFor="destination_url" className={labelClass}>Destination URL</label>
        <input
          id="destination_url"
          name="destination_url"
          type="url"
          required
          defaultValue={defaultValues.destination_url}
          placeholder="https://"
          className={inputClass}
        />
      </div>

      {/* Price */}
      <div>
        <label className={labelClass}>Price (USD)</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                if (priceInputRef.current) priceInputRef.current.value = String(p);
              }}
              className="px-4 py-1.5 text-sm border border-border rounded-full text-muted-foreground hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
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
          className={inputClass}
        />
        <p className={hintClass}>Minimum $9.99</p>
      </div>

      {/* Preview image */}
      <div>
        <label className={labelClass}>
          Preview image{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </label>
        <p className={hintClass + " mb-2"}>
          Recommended: 1200×630px (1.91:1). Max 2MB. JPG, PNG, or WebP.
        </p>
        {imagePreviewUrl && (
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="w-full max-w-sm rounded-xl object-cover mb-3"
            style={{ aspectRatio: "1.91/1" }}
          />
        )}
        <label
          htmlFor="preview_image"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-xl cursor-pointer text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          {imagePreviewUrl ? "Change image" : "Upload image"}
        </label>
        <input
          ref={fileInputRef}
          id="preview_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="sr-only"
        />
        {imageFile && (
          <p className="text-xs text-muted-foreground mt-1.5">{imageFile.name}</p>
        )}
        {imageError && (
          <p className="text-destructive text-xs mt-1.5">{imageError}</p>
        )}
      </div>

      {/* Expiry */}
      <div>
        <label htmlFor="expires_at" className={labelClass}>
          Expiry date{" "}
          <span className="font-normal text-muted-foreground">optional</span>
        </label>
        <p className={hintClass + " mb-2"}>Link stops accepting payments after this date.</p>
        <input
          id="expires_at"
          name="expires_at"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className={inputClass}
        />
        {expiresAt && formatExpiryPreview(expiresAt) && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
            Shows a "Limited offer" badge with {formatExpiryPreview(expiresAt)} remaining.
          </p>
        )}
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
