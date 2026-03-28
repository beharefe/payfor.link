"use client";

import { updateProfile } from "@unseallink/app/actions/settings";
import { Input } from "@unseallink/components/ui/input";
import { Camera, Loader2 } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  currentName: string;
  currentBio: string;
  currentAvatarUrl: string | null;
};

export function SettingsForm({ currentName, currentBio, currentAvatarUrl }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadPending, _startUpload] = useTransition();

  const [state, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      if (avatarFile) {
        const uploadBody = new FormData();
        uploadBody.append("file", avatarFile);
        const res = await fetch("/api/upload-avatar", { method: "POST", body: uploadBody });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return body.error ?? "Avatar upload failed. Please try again.";
        }
        const { url } = await res.json();
        formData.set("avatar_url", url);
      } else {
        formData.set("avatar_url", currentAvatarUrl ?? "");
      }
      const result = await updateProfile(formData);
      if ("error" in result) return result.error;
      return "saved";
    },
    null,
  );

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("Only JPG, PNG, or WebP supported");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setAvatarError("Image must be under 2MB");
      return;
    }
    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Compact avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative shrink-0 group cursor-pointer rounded-full border-none p-0 bg-transparent"
          title="Change photo"
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-14 h-14 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center text-lg font-medium text-foreground">
              {currentName?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <Camera className="size-4 text-white" aria-hidden="true" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">Profile photo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Max 2MB. JPG, PNG, or WebP.</p>
          {avatarError && <p className="text-destructive text-xs mt-1">{avatarError}</p>}
        </div>
      </div>

      {/* Display name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
          Display name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          maxLength={60}
          required
          placeholder="Alex Templates"
          className="rounded-xl h-11"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Shown on your paywall pages. You can change it any time.
        </p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1.5">
          Short bio <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={currentBio}
          maxLength={300}
          rows={3}
          placeholder="I make templates and resources for designers."
          className="block w-full px-3 py-2.5 border border-input rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1.5">Max 300 characters.</p>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={isPending || uploadPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground border-none rounded-full font-medium cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {isPending && <Loader2 className="animate-spin size-4 shrink-0" />}
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {state === "saved" && (
          <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Saved ✓</span>
        )}
        {state && state !== "saved" && (
          <span className="text-destructive text-sm">{state}</span>
        )}
      </div>
    </form>
  );
}
