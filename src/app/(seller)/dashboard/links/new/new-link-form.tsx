"use client";

import { createProductAction } from "@unseallink/app/actions/product";
import { Clock, Loader2, LockKeyhole, Mail, Timer } from "lucide-react";
import { useRef, useState, useTransition } from "react";

const PRICE_PRESETS = [9.99, 19, 29, 49];
const MIN_PRICE = 9.99;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_RATIO = 1.5;
const MAX_RATIO = 2.4;

function getImageRatio(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.width / img.height); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

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
const inputErrorClass =
  "w-full px-4 py-2.5 border border-destructive rounded-xl bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive transition-colors";
const labelClass = "block text-sm font-medium text-foreground mb-1.5";
const hintClass = "text-xs text-muted-foreground mt-1";

// ── Live paywall preview ──────────────────────────────────────────────────────
function PaywallPreview({
  title,
  description,
  priceNum,
  imagePreviewUrl,
  expiresAt,
}: {
  title: string;
  description: string;
  priceNum: number;
  imagePreviewUrl: string | null;
  expiresAt: string;
}) {
  const price = priceNum >= MIN_PRICE ? priceNum : MIN_PRICE;
  const expiryText = expiresAt ? formatExpiryPreview(expiresAt) : "";

  return (
    <div className="w-full space-y-3">
      {imagePreviewUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          <img
            src={imagePreviewUrl}
            alt={title || "Preview"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="border border-border rounded-2xl bg-card p-6 space-y-5">
        <div>
          {expiresAt && expiryText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
              <Clock className="w-3 h-3" aria-hidden="true" />
              Limited offer · expires in {expiryText}
            </div>
          )}
          <p className="text-2xl font-medium tracking-tight text-foreground leading-snug mb-2">
            {title || (
              <span className="text-muted-foreground font-normal italic">Your title</span>
            )}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-medium text-foreground tabular-nums">
            ${price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">USD · one-time</span>
        </div>

        <button
          type="button"
          disabled
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-full font-medium text-base opacity-60 cursor-not-allowed border-none"
        >
          Pay ${price.toFixed(2)}
        </button>

        <div className="flex items-center justify-center gap-4 pt-1">
          {([
            { icon: LockKeyhole, label: "Secure" },
            { icon: Mail, label: "By email" },
            { icon: Timer, label: "Instant" },
          ] as const).map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-[11px] text-muted-foreground leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Payments &amp; refunds handled by{" "}
        <span className="font-medium text-foreground">Stripe</span>
      </p>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
export function NewLinkForm() {
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [priceValue, setPriceValue] = useState<string>("9.99");
  const [titleValue, setTitleValue] = useState<string>("");
  const [descriptionValue, setDescriptionValue] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [limitToOneSale, setLimitToOneSale] = useState(false);
  const [isPending, startTransition] = useTransition();
  const priceInputRef = useRef<HTMLInputElement>(null);
  const prevObjectUrl = useRef<string | null>(null);

  const priceNum = parseFloat(priceValue);
  const priceInvalid = priceValue !== "" && (isNaN(priceNum) || priceNum < MIN_PRICE);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (prevObjectUrl.current) {
      URL.revokeObjectURL(prevObjectUrl.current);
      prevObjectUrl.current = null;
    }
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      setImageError(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError("Only JPG, PNG, or WebP images are supported");
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image must be under 2MB");
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    try {
      const ratio = await getImageRatio(file);
      if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
        setImageError(
          `Image must be landscape ~1.91:1 (e.g. 1200×630px). Your image: ${ratio.toFixed(2)}:1`,
        );
        setImageFile(null);
        setImagePreviewUrl(null);
        return;
      }
    } catch {
      setImageError("Could not read image dimensions");
      setImageFile(null);
      setImagePreviewUrl(null);
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
      if (expiresAt) {
        formData.set("expires_at", new Date(expiresAt).toISOString());
      }

      if (imageFile) {
        const uploadBody = new FormData();
        uploadBody.append("file", imageFile);
        const res = await fetch("/api/upload-preview", { method: "POST", body: uploadBody });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Image upload failed. Please try again.");
          return;
        }
        const { url } = await res.json();
        formData.set("preview_image_url", url);
      }

      try {
        const result = await createProductAction(null, formData);
        if (result) setError(result);
      } catch (err: unknown) {
        // Re-throw Next.js redirect errors — they are intentional navigation, not failures
        if (err && typeof err === "object" && "digest" in err &&
            typeof (err as { digest: unknown }).digest === "string" &&
            (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      {/* Mobile tabs */}
      <div className="flex lg:hidden border-b border-border mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
        {(["edit", "preview"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              mobileTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2-col on desktop, single col + tabs on mobile */}
      <div className="grid lg:grid-cols-[1fr_360px] lg:gap-x-12 lg:items-start">

        {/* ── Left: form ── */}
        <form
          onSubmit={handleSubmit}
          className={`flex flex-col gap-6 ${mobileTab === "preview" ? "hidden lg:flex" : ""}`}
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className={labelClass}>Title</label>
            <input
              id="title"
              name="title"
              required
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Your link (destination URL) */}
          <div>
            <label htmlFor="destination_url" className={labelClass}>Your link</label>
            <input
              id="destination_url"
              name="destination_url"
              type="url"
              required
              placeholder="https://notion.so/your-template, drive.google.com/…"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={labelClass}>
              Description{" "}
              <span className="font-normal text-muted-foreground">optional</span>
            </label>
            <input
              id="description"
              name="description"
              type="text"
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Short description shown on the paywall page"
              className={inputClass}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className={labelClass}>Price (USD)</label>
            <div className="relative mb-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none pointer-events-none">
                $
              </span>
              <input
                ref={priceInputRef}
                id="price"
                name="price"
                type="number"
                min={MIN_PRICE}
                step={0.01}
                required
                defaultValue={MIN_PRICE}
                onChange={(e) => setPriceValue(e.target.value)}
                className={`${priceInvalid ? inputErrorClass : inputClass} pl-8`}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {PRICE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPriceValue(String(p));
                    if (priceInputRef.current) priceInputRef.current.value = String(p);
                  }}
                  className={`px-3 py-1 text-xs border rounded-full transition-colors cursor-pointer ${
                    priceNum === p
                      ? "border-foreground text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>
            {priceInvalid && (
              <p className="text-xs text-destructive mt-1.5">Minimum price is $9.99</p>
            )}
          </div>

          {/* Preview image */}
          <div>
            <label className={labelClass}>
              Preview image{" "}
              <span className="font-normal text-muted-foreground">optional</span>
            </label>
            <p className={`${hintClass} mb-2`}>
              Recommended: 1200×630px (1.91:1). Max 2MB. JPG, PNG, or WebP.
            </p>
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt="Preview"
                className="w-full max-w-xs rounded-xl object-cover mb-3"
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
            <p className={`${hintClass} mb-2`}>Link stops accepting payments after this date.</p>
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

          {/* One buyer only */}
          <div className="flex items-start justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium text-foreground leading-snug">One buyer only</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs leading-relaxed">
                The link closes after the first sale. Use for exclusive freelance deliverables
                or single-client work. Leave off for templates and anything you sell repeatedly.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={limitToOneSale}
              onClick={() => setLimitToOneSale((v) => !v)}
              className={`relative shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border-none cursor-pointer ${
                limitToOneSale ? "bg-foreground" : "bg-input"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background shadow-sm transition-transform ${
                  limitToOneSale ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <input type="hidden" name="max_orders" value={limitToOneSale ? "1" : ""} />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isPending || priceInvalid}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground rounded-full text-base font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border-none mt-2"
          >
            {isPending && <Loader2 className="animate-spin size-4 shrink-0" />}
            {isPending ? "Creating…" : "Create link →"}
          </button>
        </form>

        {/* ── Right: live preview ── */}
        <div
          className={`lg:sticky lg:top-20 ${mobileTab === "edit" ? "hidden lg:block" : ""}`}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Preview
          </p>
          <PaywallPreview
            title={titleValue}
            description={descriptionValue}
            priceNum={priceNum}
            imagePreviewUrl={imagePreviewUrl}
            expiresAt={expiresAt}
          />
        </div>
      </div>
    </>
  );
}
