import {
  createClient,
  createServiceClient,
} from "@unseallink/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

const BUCKET = "preview-images";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const SIGNATURES = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff], offset: 0 },
  {
    mime: "image/png",
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
] as const;

function detectMime(buffer: Uint8Array): string | null {
  for (const sig of SIGNATURES) {
    const match = sig.bytes.every((b, i) => buffer[sig.offset + i] === b);
    if (!match) continue;
    if (sig.mime === "image/webp") {
      const webp = [0x57, 0x45, 0x42, 0x50];
      if (!webp.every((b, i) => buffer[8 + i] === b)) continue;
    }
    return sig.mime;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size === 0)
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json(
      { error: "Image must be under 2MB" },
      { status: 400 },
    );
  if (!ALLOWED_MIME.has(file.type))
    return NextResponse.json(
      { error: "Only JPG, PNG, or WebP images are allowed" },
      { status: 400 },
    );

  const buffer = new Uint8Array(await file.arrayBuffer());
  const detectedMime = detectMime(buffer);
  if (!detectedMime)
    return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
  if (detectedMime !== file.type)
    return NextResponse.json({ error: "File type mismatch" }, { status: 400 });

  const ext = EXT_MAP[detectedMime];
  const timestamp = Date.now();
  const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  // Use fixed path per user so old avatars get replaced
  const path = `avatars/${user.id}/avatar-${timestamp}-${rand}.${ext}`;

  const serviceClient = createServiceClient();
  const { error: uploadError } = await serviceClient.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: detectedMime, upsert: false });

  if (uploadError)
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );

  const {
    data: { publicUrl },
  } = serviceClient.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
