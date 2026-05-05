"use client";

import { useState, useRef } from "react";

// Onboarding is always dynamic — requires authenticated user session
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, Check } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { PersonalityType } from "@/types/database";

/* -------------------------------------------------------------------------- */
/*  Step data                                                                   */
/* -------------------------------------------------------------------------- */

const personalityOptions: {
  emoji: string;
  label: string;
  description: string;
  value: PersonalityType;
}[] = [
  {
    emoji: "🌿",
    label: "Creating & sharing",
    description: "Art, writing, music",
    value: "creative",
  },
  {
    emoji: "🍃",
    label: "Nature & outdoors",
    description: "Walks, gardens, sky",
    value: "nature_lover",
  },
  {
    emoji: "🏡",
    label: "Home & family",
    description: "Warmth, togetherness",
    value: "homebody",
  },
  {
    emoji: "📚",
    label: "Learning & ideas",
    description: "Books, questions, growth",
    value: "intellectual",
  },
  {
    emoji: "🌍",
    label: "Adventure & travel",
    description: "New places, new people",
    value: "adventurer",
  },
  {
    emoji: "🤍",
    label: "Caring for others",
    description: "Support, empathy, community",
    value: "caregiver",
  },
];

const timeOptions: {
  emoji: string;
  label: string;
  value: string;
}[] = [
  { emoji: "🌅", label: "Mornings", value: "morning" },
  { emoji: "☀️", label: "Afternoons", value: "afternoon" },
  { emoji: "🌙", label: "Evenings", value: "evening" },
  { emoji: "✨", label: "It varies", value: "varies" },
];

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                          */
/* -------------------------------------------------------------------------- */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);
  const [personality, setPersonality] = useState<PersonalityType | null>(null);
  const [timePreference, setTimePreference] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function goToStep(next: 1 | 2 | 3) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Image must be under 5 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleFinish(skipAvatar = false) {
    setSaving(true);
    setSaveError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatarUrl: string | null = null;

      /* Upload avatar if provided */
      if (!skipAvatar && avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      /* Update users row */
      const { error: userError } = await supabase
        .from("users")
        .update({
          personality_type: personality,
          onboarding_completed: true,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq("id", user.id);
      if (userError) throw userError;

      /* Update personality_profiles */
      const { error: profileError } = await supabase
        .from("personality_profiles")
        .update({
          time_preferences: { preferred_time: timePreference },
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      router.push("/feed");
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setSaving(false);
    }
  }

  const dots = (
    <div className="flex justify-center gap-2 mb-10">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="h-2 w-2 rounded-full transition-colors duration-300"
          style={{ background: n === step ? "#8ABD80" : "rgba(255,255,255,0.15)" }}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  const backButton = step > 1 && (
    <button
      onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
      className="flex items-center gap-1 font-sans text-sm transition-colors mb-6"
      style={{ color: "rgba(245,240,232,0.35)" }}
      type="button"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </button>
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-8 py-16" style={{ background: "#1A1A18" }}>
      <div className="w-full max-w-md">
        {dots}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* STEP 1 — Personality */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-[300]" style={{ color: "#F5F0E8" }}>
                    Tell us a little about yourself
                  </h1>
                  <p className="font-sans text-base" style={{ color: "rgba(245,240,232,0.45)" }}>
                    Your companion will use this to understand you — not to target you. This stays with you.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {personalityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPersonality(opt.value)}
                      className="relative text-left rounded-xl p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
                      style={{
                        background: personality === opt.value ? "rgba(78,122,68,0.15)" : "rgba(255,255,255,0.03)",
                        border: personality === opt.value ? "2px solid rgba(138,189,128,0.4)" : "2px solid rgba(255,255,255,0.07)",
                        transform: personality === opt.value ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {personality === opt.value && (
                        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ background: "linear-gradient(135deg, #5E9A52, #3A6032)" }}>
                          <Check size={11} className="text-white" aria-hidden="true" />
                        </span>
                      )}
                      <span className="text-2xl block mb-2">{opt.emoji}</span>
                      <span className="block font-sans font-medium text-sm leading-tight" style={{ color: "#F5F0E8" }}>
                        {opt.label}
                      </span>
                      <span className="block font-sans text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.40)" }}>
                        {opt.description}
                      </span>
                    </button>
                  ))}
                </div>

                {personality && <Button className="w-full" size="lg" onClick={() => goToStep(2)}>Continue</Button>}
              </div>
            )}

            {/* STEP 2 — Time preference */}
            {step === 2 && (
              <div className="space-y-8">
                {backButton}
                <h1 className="font-display text-3xl font-[300]" style={{ color: "#F5F0E8" }}>
                  When do you usually have time to yourself?
                </h1>

                <div className="grid grid-cols-2 gap-3">
                  {timeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimePreference(opt.value)}
                      className="relative text-left rounded-xl p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
                      style={{
                        background: timePreference === opt.value ? "rgba(78,122,68,0.15)" : "rgba(255,255,255,0.03)",
                        border: timePreference === opt.value ? "2px solid rgba(138,189,128,0.4)" : "2px solid rgba(255,255,255,0.07)",
                        transform: timePreference === opt.value ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {timePreference === opt.value && (
                        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                          style={{ background: "linear-gradient(135deg, #5E9A52, #3A6032)" }}>
                          <Check size={11} className="text-white" aria-hidden="true" />
                        </span>
                      )}
                      <span className="text-2xl block mb-2">{opt.emoji}</span>
                      <span className="block font-sans font-medium text-sm" style={{ color: "#F5F0E8" }}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>

                {timePreference && <Button className="w-full" size="lg" onClick={() => goToStep(3)}>Continue</Button>}
              </div>
            )}

            {/* STEP 3 — Avatar */}
            {step === 3 && (
              <div className="space-y-8">
                {backButton}
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-[300]" style={{ color: "#F5F0E8" }}>
                    Add a photo — or skip for now
                  </h1>
                  <p className="font-sans text-base" style={{ color: "rgba(245,240,232,0.45)" }}>
                    You can always add one later from your profile.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[120px] w-[120px] rounded-full overflow-hidden flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
                    style={{
                      border: "2px dashed rgba(138,189,128,0.3)",
                      background: avatarPreview ? "transparent" : "rgba(255,255,255,0.03)",
                    }}
                    aria-label="Upload profile photo"
                  >
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-sans text-sm text-center px-3" style={{ color: "rgba(245,240,232,0.35)" }}>
                        Tap to add photo
                      </span>
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                </div>

                {saveError && <p className="text-sm text-destructive text-center">{saveError}</p>}

                <div className="space-y-3">
                  <Button className="w-full" size="lg" onClick={() => handleFinish(false)} disabled={saving}>
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up your space…</> : "Finish"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleFinish(true)}
                    disabled={saving}
                    className="w-full font-sans text-sm text-center transition-colors"
                    style={{ color: "rgba(245,240,232,0.30)" }}
                  >
                    Skip for now
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
