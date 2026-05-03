"use client";

// All post creation is dynamic (requires auth + live uploads)
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";

import { ContentTypeSelector } from "@/components/post/content-type-selector";
import { MediaUploader } from "@/components/post/media-uploader";
import { MoodTagSelector } from "@/components/post/mood-tag-selector";
import { Button } from "@/components/ui/button";
import { Heading, Body, Companion } from "@/components/ui/typography";
import type { MoodTag } from "@/types/database";

/* -------------------------------------------------------------------------- */
/*  Types                                                                       */
/* -------------------------------------------------------------------------- */
type PostContentType = "photo" | "video" | "text" | "slow_post";
type Step = 1 | 2 | 3 | 4;

/* -------------------------------------------------------------------------- */
/*  Animation (same as onboarding)                                             */
/* -------------------------------------------------------------------------- */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

/* -------------------------------------------------------------------------- */
/*  Leaf SVG (reused from daily-limit-screen style)                            */
/* -------------------------------------------------------------------------- */
function LeafIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path
        d="M40 70 C20 70 10 55 10 38 C10 20 25 8 40 8 C55 8 70 20 70 38 C70 55 60 70 40 70Z"
        fill="#87AA7E"
        opacity="0.7"
      />
      <path
        d="M40 68 C40 68 40 25 40 12"
        stroke="#4E7A44"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step dots                                                                   */
/* -------------------------------------------------------------------------- */
function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2 mb-8">
      {([1, 2, 3, 4] as Step[]).map((n) => (
        <div
      key={n}
      className={`h-2 w-2 rounded-full transition-colors duration-300`}
      style={{ background: n === step ? "#8ABD80" : "rgba(255,255,255,0.15)" }}
      aria-hidden="true"
    />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */
export default function CreatePage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);

  // Post state
  const [contentType, setContentType] = useState<PostContentType | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [textContent, setTextContent] = useState("");
  const [caption, setCaption] = useState("");
  const [moodTag, setMoodTag] = useState<MoodTag | null>(null);

  // Submit state
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);

  // Media errors
  const [mediaError, setMediaError] = useState<string | null>(null);

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  const isTextType =
    contentType === "text" || contentType === "slow_post";

  /* ---------- Step 2 continue guard ---------- */
  const step2Ready = isTextType
    ? textContent.trim().length >= 10
    : mediaUrls.length > 0;

  /* ---------- Publish ---------- */
  async function handlePublish() {
    if (!contentType || !moodTag) return;
    setPublishing(true);
    setPublishError(null);

    try {
      const res = await fetch("/api/creator/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType,
          caption: caption || undefined,
          media_urls: mediaUrls.length ? mediaUrls : undefined,
          mood_tag: moodTag,
          text_content: isTextType ? textContent : undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      const data = (await res.json()) as {
        post_id: string;
        ai_companion_message: string;
      };
      setPostId(data.post_id);
      setSuccessMessage(data.ai_companion_message);
    } catch (e) {
      setPublishError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    } finally {
      setPublishing(false);
    }
  }

  /* ================================================================== */
  /*  Success screen                                                      */
  /* ================================================================== */
  if (successMessage) {
    return (
      <main className="min-h-screen bg-[#1A1A18] flex items-center justify-center px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm flex flex-col items-center text-center space-y-6"
        >
          <LeafIcon />

          <Heading as="h1" size="lg">
            Shared with your people.
          </Heading>

          <Body muted>Your companion has left you a note.</Body>

          <div className="rounded-xl px-6 py-5 w-full" style={{ background: "rgba(78,122,68,0.12)", borderLeft: "2px solid rgba(138,189,128,0.35)" }}>
            <Companion>{successMessage}</Companion>
          </div>

          <Button
            className="w-full mt-4"
            size="lg"
            onClick={() => {
              void postId; // referenced to avoid lint warning
              router.push("/feed");
            }}
          >
            See your post
          </Button>
        </motion.div>
      </main>
    );
  }

  /* ================================================================== */
  /*  Multi-step creation wizard                                         */
  /* ================================================================== */
  return (
    <main className="min-h-screen bg-[#1A1A18] px-6 py-12">
      <div className="w-full max-w-lg mx-auto">
        <StepDots step={step} />

        {/* Back button */}
        {step > 1 && (
          <button
            onClick={() => goTo((step - 1) as Step)}
            type="button"
            className="flex items-center gap-1 font-sans text-sm transition-colors mb-6"
            style={{ color: "rgba(245,240,232,0.35)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* ============================================================ */}
            {/* STEP 1 — Content type                                         */}
            {/* ============================================================ */}
            {step === 1 && (
              <div className="space-y-8">
                <Heading as="h1" size="lg">
                  What would you like to share?
                </Heading>

                <ContentTypeSelector
                  value={contentType}
                  onChange={setContentType}
                />

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!contentType}
                  onClick={() => goTo(2)}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2 — Media / Text                                         */}
            {/* ============================================================ */}
            {step === 2 && contentType && (
              <div className="space-y-6">
                {contentType === "photo" && (
                  <>
                    <Heading as="h2" size="md">
                      Add your photos
                    </Heading>
                    <MediaUploader
                      accept="image/*"
                      maxFiles={10}
                      onUploadComplete={(urls) => {
                        setMediaUrls(urls);
                        setMediaError(null);
                      }}
                      onUploadError={(err) => setMediaError(err)}
                    />
                    {mediaError && (
                      <p className="font-sans text-sm text-destructive">
                        {mediaError}
                      </p>
                    )}
                  </>
                )}

                {contentType === "video" && (
                  <>
                    <Heading as="h2" size="md">
                      Add your video
                    </Heading>
                    <MediaUploader
                      accept="video/*"
                      maxFiles={1}
                      onUploadComplete={(urls) => {
                        setMediaUrls(urls);
                        setMediaError(null);
                      }}
                      onUploadError={(err) => setMediaError(err)}
                    />
                    {mediaError && (
                      <p className="font-sans text-sm text-destructive">
                        {mediaError}
                      </p>
                    )}
                  </>
                )}

                {(contentType === "text" ||
                  contentType === "slow_post") && (
                  <>
                    {contentType === "slow_post" && (
            <div className="bg-sage-500/15 rounded-xl px-5 py-4" style={{ border: "1px solid rgba(78,122,68,0.2)" }}>
                        <p className="font-sans text-sm" style={{ color: "rgba(138,189,128,0.8)" }}>
                          This post will be delivered to your followers
                          gradually over 48 hours.
                        </p>
                      </div>
                    )}

                    <div className="relative">
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        maxLength={500}
                        placeholder="What's on your mind?"
                        rows={6}
                        className="w-full resize-none rounded-xl px-5 py-4 font-sans text-base leading-[1.7] focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#F5F0E8",
                          minHeight: 120,
                        }}
                      />
                      <span className="absolute bottom-3 right-4 font-sans text-xs text-slate-hint">
                        {textContent.length}/500
                      </span>
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!step2Ready}
                  onClick={() => goTo(3)}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3 — Caption + mood                                       */}
            {/* ============================================================ */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Caption (optional for media, shown for all types) */}
                <div className="space-y-2">
                  <label
                    htmlFor="caption"
                    className="font-sans text-sm uppercase tracking-wider"
                    style={{ color: "rgba(245,240,232,0.50)" }}
                  >
                    Caption{" "}
                    <span className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
                      {isTextType ? "" : "(optional)"}
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={300}
                      placeholder="Add a caption..."
                      rows={3}
                      className="w-full resize-none rounded-xl px-5 py-4 font-sans text-base leading-[1.7] focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#F5F0E8",
                      }}
                    />
                    <span className="absolute bottom-3 right-4 font-sans text-xs text-slate-hint">
                      {caption.length}/300
                    </span>
                  </div>
                </div>

                {/* Mood */}
                <div className="space-y-4">
                  <label className="font-sans text-sm uppercase tracking-wider" style={{ color: "rgba(245,240,232,0.50)" }}>
                    How does this feel?
                  </label>
                  <MoodTagSelector value={moodTag} onChange={setMoodTag} />
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!moodTag}
                  onClick={() => goTo(4)}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4 — Preview + Publish                                    */}
            {/* ============================================================ */}
            {step === 4 && contentType && (
              <div className="space-y-8">
                <Heading as="h2" size="md">
                  Ready to share?
                </Heading>

                {/* Preview card */}
                <div className="rounded-xl px-6 py-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Media preview */}
                  {mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {mediaUrls.slice(0, 4).map((url, i) => (
                        contentType === "video" ? (
                          <video
                            key={url}
                            src={url}
                            muted
                            playsInline
                            className="w-full rounded-lg"
                            style={{ maxHeight: 180 }}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={url}
                            src={url}
                            alt={`Preview ${i + 1}`}
                            className="aspect-square w-full rounded-lg object-cover"
                          />
                        )
                      ))}
                    </div>
                  )}

                  {isTextType && textContent && (
                    <p className="font-sans text-base leading-[1.7]" style={{ color: "rgba(245,240,232,0.7)" }}>
                      {textContent}
                    </p>
                  )}

                  {caption && (
                    <p className="font-sans text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>
                      {caption}
                    </p>
                  )}

                  {moodTag && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-medium"
                      style={{ background: "rgba(78,122,68,0.2)", color: "#8ABD80" }}
                    >
                      {moodTag}
                    </span>
                  )}
                </div>

                {publishError && (
                  <p className="font-sans text-sm text-destructive">
                    {publishError}
                  </p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePublish}
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    "Publish"
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
