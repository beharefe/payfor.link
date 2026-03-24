"use client";

import { useActionState, useState, useTransition } from "react";
import { updateProfile } from "@unseallink/app/actions/settings";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  currentName: string;
  currentBio: string;
  currentAvatarUrl: string | null;
};

export function SettingsForm({ currentName, currentBio, currentAvatarUrl }: Props) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadPending, startUpload] = useTransition();

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

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #E5E5E5",
    borderRadius: "12px",
    fontSize: "1rem",
    marginBottom: "0.75rem",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontWeight: 500,
    marginBottom: "0.25rem",
  };

  const hintStyle = {
    color: "#6B6B6B",
    fontSize: "0.875rem",
    margin: "0 0 0.5rem",
  };

  return (
    <form action={formAction}>
      {/* Display name */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="name" style={labelStyle}>Display name</label>
        <p style={hintStyle}>Shown on your paywall pages as "by [name]"</p>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={currentName}
          maxLength={60}
          required
          style={inputStyle}
        />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="bio" style={labelStyle}>Short bio</label>
        <p style={hintStyle}>One or two sentences about you or your work. Max 300 characters.</p>
        <textarea
          id="bio"
          name="bio"
          defaultValue={currentBio}
          maxLength={300}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" as const }}
        />
      </div>

      {/* Avatar */}
      <div style={{ marginBottom: "1.75rem" }}>
        <label style={labelStyle}>Avatar</label>
        <p style={hintStyle}>Square image recommended. Max 2MB — JPG, PNG, or WebP.</p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          {avatarPreview && (
            <img
              src={avatarPreview}
              alt="Avatar"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1.5px solid #E5E5E5",
              }}
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
          />
        </div>
        {avatarError && (
          <p style={{ color: "#C0392B", fontSize: "0.875rem", margin: "0.25rem 0 0" }}>{avatarError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || uploadPending}
        style={{
          padding: "10px 24px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: "100px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {isPending ? "Saving..." : "Save"}
      </button>

      {state === "saved" && (
        <span style={{ marginLeft: "1rem", color: "#1A7A4A", fontSize: "0.9rem" }}>Saved ✓</span>
      )}
      {state && state !== "saved" && (
        <span style={{ marginLeft: "1rem", color: "#C0392B", fontSize: "0.9rem" }}>{state}</span>
      )}
    </form>
  );
}
