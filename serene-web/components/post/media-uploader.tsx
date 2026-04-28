"use client";

import { useRef, useState } from "react";
import { X, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                   */
/* -------------------------------------------------------------------------- */
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const IMAGE_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const VIDEO_MAX_BYTES = 500 * 1024 * 1024; // 500 MB

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */
interface UploadedFile {
  url: string;
  previewUrl: string; // object URL for preview (revoked on removal)
  type: "image" | "video";
  name: string;
}

interface MediaUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError: (error: string) => void;
  maxFiles?: number;
  accept?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                   */
/* -------------------------------------------------------------------------- */
export function MediaUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  accept = "image/*",
}: MediaUploaderProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const [progress, setProgress] = useState<number | null>(null); // 0–100 or null
  const [dragOver, setDragOver] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const isVideo = accept.startsWith("video");

  /* -------- Validate a single File -------- */
  function validateFile(file: File): string | null {
    const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
    if (!allowed.includes(file.type)) {
      return `"${file.name}" is not a supported file type. Use ${isVideo ? "MP4 or MOV" : "JPG, PNG, WEBP, or GIF"}.`;
    }
    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > maxBytes) {
      return `"${file.name}" is too large. Maximum ${isVideo ? "500 MB" : "50 MB"} per file.`;
    }
    return null;
  }

  /* -------- Upload a validated File to Supabase Storage -------- */
  async function uploadFile(file: File): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("You must be signed in to upload media.");

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${timestamp}_${safeName}`;

    // Use the SDK's upload() so it automatically attaches the user's session
    // JWT — the anon key alone doesn't satisfy auth.uid() RLS checks on storage.
    // Fake incremental progress since the JS SDK doesn't expose native progress.
    setProgress(10);
    const fakeTimer = setInterval(() => {
      setProgress((prev) =>
        prev !== null && prev < 85 ? prev + 7 : prev
      );
    }, 200);

    try {
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      setProgress(100);
      setTimeout(() => setProgress(null), 400);

      const { data } = supabase.storage.from("posts").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      clearInterval(fakeTimer);
    }
  }

  /* -------- Handle new files (from drop or picker) -------- */
  async function handleFiles(fileList: FileList) {
    setFieldError(null);
    const files = Array.from(fileList);

    if (uploaded.length + files.length > maxFiles) {
      setFieldError(
        `You can upload up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`
      );
      return;
    }

    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        setFieldError(err);
        return;
      }
    }

    const newUploaded: UploadedFile[] = [];
    for (const file of files) {
      try {
        const url = await uploadFile(file);
        newUploaded.push({
          url,
          previewUrl: URL.createObjectURL(file),
          type: isVideo ? "video" : "image",
          name: file.name,
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Upload failed. Please try again.";
        setFieldError(msg);
        onUploadError(msg);
        return;
      }
    }

    const next = [...uploaded, ...newUploaded];
    setUploaded(next);
    onUploadComplete(next.map((f) => f.url));
  }

  function removeFile(index: number) {
    const next = uploaded.filter((_, i) => i !== index);
    URL.revokeObjectURL(uploaded[index].previewUrl);
    setUploaded(next);
    onUploadComplete(next.map((f) => f.url));
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {uploaded.length < maxFiles && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload media"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
            dragOver
              ? "border-sage-400 bg-sage-100"
              : "border-cream-200 bg-cream-50 hover:border-sage-200 hover:bg-cream-100"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-slate-hint" aria-hidden="true" />
          <div className="text-center">
            <p className="font-sans text-sm text-slate-warm">
              Drop {isVideo ? "a video" : "photos"} here, or{" "}
              <span className="text-sage-600 underline-offset-2 hover:underline">
                browse
              </span>
            </p>
            <p className="font-sans text-xs text-slate-hint mt-1">
              {isVideo
                ? "MP4 or MOV — up to 500 MB"
                : "JPG, PNG, WEBP or GIF — up to 50 MB each"}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          // Reset so the same file can be re-picked after removal
          e.target.value = "";
        }}
      />

      {/* Progress bar */}
      {progress !== null && (
        <div
          className="h-0.5 rounded-full bg-cream-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-full bg-sage-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Inline validation / upload error */}
      {fieldError && (
        <p className="font-sans text-sm text-destructive">{fieldError}</p>
      )}

      {/* Preview grid */}
      {uploaded.length > 0 && (
        <div className={uploaded[0].type === "video" ? "" : "grid grid-cols-2 sm:grid-cols-3 gap-2"}>
          {uploaded.map((file, i) => (
            <div key={file.url} className="relative group">
              {file.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.previewUrl}
                  alt={`Upload ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <video
                  src={file.previewUrl}
                  controls
                  muted
                  playsInline
                  className="w-full rounded-lg"
                  style={{ maxHeight: 300 }}
                />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${file.name}`}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cream-50 text-slate-warm shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
