"use client";

import { updateProfile } from "@unseallink/app/actions/settings";
import { useActionState, useState, useTransition } from "react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  currentName: string;
  currentBio: string;
  currentAvatarUrl: string | null;
};

export function SettingsForm({
  currentName,
  currentBio,
  currentAvatarUrl,
}: Props) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    currentAvatarUrl,
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadPending, _startUpload] = useTransition();

  const [state, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      // Upload avatar if a new file was selected
      if (avatarFile) {
        const uploadBody = new FormData();
        uploadBody.append("file", avatarFile);

        const res = await fetch("/api/upload-avatar", {
          method: "POST",
          body: uploadBody,
        });

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
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(currentAvatarUrl);
      setAvatarError(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("Only JPG, PNG, or WebP supported");
      setAvatarFile(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setAvatarError("Image must be under 2MB");
      setAvatarFile(null);
      return;
    }

    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction}>
      {/* Display name */}
      <div className="mb-6">
        <label htmlFor="name" className="block font-medium mb-1">
          Display name
        </label>
        <p className="text-muted-foreground text-sm mb-2">Shown on your paywall pages as "by [name]"</p>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          maxLength={60}
          required
          className="block w-full px-4 py-2.5 border border-input rounded-xl text-base mb-3 bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none box-border"
        />
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label htmlFor="bio" className="block font-medium mb-1">
          Short bio
        </label>
        <p className="text-muted-foreground text-sm mb-2">
          One or two sentences about you or your work. Max 300 characters.
        </p>
        <textarea
          id="bio"
          name="bio"
          defaultValue={currentBio}
          maxLength={300}
          rows={3}
          className="block w-full px-4 py-2.5 border border-input rounded-xl text-base mb-3 bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none box-border resize-y"
        />
      </div>

      {/* Avatar */}
      <div className="mb-7">
        <label className="block font-medium mb-1">Avatar</label>
        <p className="text-muted-foreground text-sm mb-2">
          Square image recommended. Max 2MB — JPG, PNG, or WebP.
        </p>
        <div className="flex items-center gap-4 mb-2">
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-14 h-14 rounded-full object-cover border border-border"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
          />
        </div>
        {avatarError && (
          <p className="text-destructive text-sm mt-1">
            {avatarError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || uploadPending}
        className="px-6 py-2.5 bg-primary text-primary-foreground border-none rounded-full font-medium cursor-pointer hover:opacity-90 transition-opacity"
      >
        {isPending ? "Saving..." : "Save"}
      </button>

      {state === "saved" && (
        <span className="ml-4 text-green-700 dark:text-green-400 text-sm">
          Saved ✓
        </span>
      )}
      {state && state !== "saved" && (
        <span className="ml-4 text-destructive text-sm">
          {state}
        </span>
      )}
    </form>
  );
}
