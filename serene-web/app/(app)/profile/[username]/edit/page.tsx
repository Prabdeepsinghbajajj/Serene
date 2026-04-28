"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/user-context";
import { createClient } from "@/lib/supabase/client";

/* -------------------------------------------------------------------------- */
/*  Validation schema                                                           */
/* -------------------------------------------------------------------------- */
const editSchema = z.object({
  display_name: z.string().min(2, "At least 2 characters.").max(50),
  username: z
    .string()
    .min(3, "At least 3 characters.")
    .max(20, "Maximum 20 characters.")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores.")
    .regex(/^[a-z]/, "Must start with a letter."),
  bio: z.string().max(150, "Maximum 150 characters.").optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

/* -------------------------------------------------------------------------- */
/*  Segmented control                                                           */
/* -------------------------------------------------------------------------- */
function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="font-sans text-sm text-slate-warm">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-4 py-1.5 font-sans text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
              value === opt.value
                ? "bg-sage-100 text-sage-600"
                : "bg-cream-100 text-slate-muted hover:bg-cream-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Toggle row                                                                  */
/* -------------------------------------------------------------------------- */
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="font-sans text-sm text-slate-warm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
          checked ? "bg-sage-400" : "bg-cream-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Edit profile page                                                           */
/* -------------------------------------------------------------------------- */
export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { profile: myProfile, refreshProfile } = useUser();
  const supabase = createClient();

  const username = params.username as string;

  // If the viewer is not the owner, redirect
  useEffect(() => {
    if (myProfile && myProfile.username !== username) {
      router.replace(`/profile/${username}`);
    }
  }, [myProfile, username, router]);

  /* ---- Form ---- */
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      display_name: myProfile?.display_name ?? "",
      username: myProfile?.username ?? "",
      bio: myProfile?.bio ?? "",
    },
  });

  // Re-populate when profile loads
  useEffect(() => {
    if (myProfile) {
      form.reset({
        display_name: myProfile.display_name,
        username: myProfile.username,
        bio: myProfile.bio ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myProfile?.id]);

  /* ---- Username availability check ---- */
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const usernameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleUsernameChange(value: string) {
    form.setValue("username", value, { shouldValidate: true });
    if (value === myProfile?.username || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    if (usernameDebounce.current) clearTimeout(usernameDebounce.current);
    setUsernameStatus("checking");
    usernameDebounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("username", value)
        .neq("id", myProfile?.id ?? "")
        .single();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);
  }

  /* ---- Avatar upload ---- */
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    myProfile?.avatar_url ?? null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  /* ---- Wellness settings ---- */
  const [sessionLimit, setSessionLimit] = useState<"20" | "30" | "45">("20");
  const [dailyCap, setDailyCap] = useState<"30" | "40" | "50">("30");

  /* ---- Notification settings ---- */
  const [notifyReplies, setNotifyReplies] = useState(true);
  const [notifyDMs, setNotifyDMs] = useState(true);
  const [notifyFriends, setNotifyFriends] = useState(true);

  /* ---- Save ---- */
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function onSubmit(values: EditFormValues) {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    let avatar_url: string | null = myProfile?.avatar_url ?? null;

    // Upload new avatar if selected
    if (avatarFile && myProfile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${myProfile.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatar_url = urlData.publicUrl;
      }
    }

    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: values.display_name,
        username: values.username,
        bio: values.bio || null,
        avatar_url,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setSaveError(body.error ?? "Could not save changes.");
      setIsSaving(false);
      return;
    }

    await refreshProfile();
    setSaveSuccess(true);
    setIsSaving(false);

    // If username changed, navigate to new profile URL
    if (values.username !== myProfile?.username) {
      router.replace(`/profile/${values.username}/edit`);
    }

    // Fade out success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  const initials = (myProfile?.display_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-xl mx-auto px-4 pt-8 pb-16 space-y-8">
      <h1 className="font-serif text-2xl font-[500] text-slate-warm">
        Edit your profile
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ---- Avatar ---- */}
          <div className="flex items-center gap-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
              aria-label="Change avatar"
              className="relative cursor-pointer group focus:outline-none"
            >
              <Avatar className="h-20 w-20">
                {avatarPreview && (
                  <AvatarImage src={avatarPreview} alt="Your avatar" />
                )}
                <AvatarFallback className="bg-sage-200 text-sage-800 text-xl font-sans">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-sans text-sm text-sage-600 hover:underline focus:outline-none"
              >
                Change photo
              </button>
              <p className="font-sans text-xs text-slate-hint mt-0.5">
                JPG, PNG or WebP · max 5 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
              aria-label="Upload avatar"
            />
          </div>

          {/* ---- Display name ---- */}
          <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-sans text-sm text-slate-warm">
                  Display name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={50}
                    className="font-sans bg-cream-50 border-cream-200 text-slate-warm placeholder:text-slate-hint"
                  />
                </FormControl>
                <FormMessage className="font-sans text-xs" />
              </FormItem>
            )}
          />

          {/* ---- Username ---- */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-sans text-sm text-slate-warm">
                  Username
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={20}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="font-sans bg-cream-50 border-cream-200 text-slate-warm placeholder:text-slate-hint"
                  />
                </FormControl>
                {usernameStatus === "checking" && (
                  <p className="font-sans text-xs text-slate-hint">
                    Checking…
                  </p>
                )}
                {usernameStatus === "available" && (
                  <p className="font-sans text-xs text-sage-600">
                    Available
                  </p>
                )}
                {usernameStatus === "taken" && (
                  <p className="font-sans text-xs text-amber-warm">
                    Already taken
                  </p>
                )}
                <FormMessage className="font-sans text-xs" />
              </FormItem>
            )}
          />

          {/* ---- Bio ---- */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-sans text-sm text-slate-warm">
                  Bio
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    maxLength={150}
                    rows={3}
                    className="font-sans bg-cream-50 border-cream-200 text-slate-warm placeholder:text-slate-hint resize-none"
                  />
                </FormControl>
                <p className="font-sans text-xs text-slate-hint text-right">
                  {(field.value ?? "").length}/150
                </p>
                <FormMessage className="font-sans text-xs" />
              </FormItem>
            )}
          />

          {/* ================================================================ */}
          {/* Wellness settings                                                 */}
          {/* ================================================================ */}
          <div className="pt-4 space-y-5 border-t border-cream-200">
            <div>
              <p className="font-sans text-base font-[500] text-slate-warm">
                Your wellness settings
              </p>
              <p className="font-sans text-sm text-slate-hint mt-0.5">
                These help Serene feel better for you.
              </p>
            </div>

            <SegmentedControl
              label="Remind me to rest after"
              options={[
                { label: "20 min", value: "20" },
                { label: "30 min", value: "30" },
                { label: "45 min", value: "45" },
              ]}
              value={sessionLimit}
              onChange={setSessionLimit}
            />

            <div className="space-y-1">
              <SegmentedControl
                label="Daily post limit"
                options={[
                  { label: "30 posts", value: "30" },
                  { label: "40 posts", value: "40" },
                  { label: "50 posts", value: "50" },
                ]}
                value={dailyCap}
                onChange={setDailyCap}
              />
              <p className="font-sans text-xs text-slate-hint">
                A gentle limit helps keep browsing intentional.
              </p>
            </div>
          </div>

          {/* ================================================================ */}
          {/* Notification settings                                             */}
          {/* ================================================================ */}
          <div className="pt-4 space-y-1 border-t border-cream-200">
            <p className="font-sans text-base font-[500] text-slate-warm mb-3">
              Notifications
            </p>

            <ToggleRow
              label="Replies to my comments"
              checked={notifyReplies}
              onChange={setNotifyReplies}
            />
            <div className="border-t border-cream-200" />
            <ToggleRow
              label="Direct messages"
              checked={notifyDMs}
              onChange={setNotifyDMs}
            />
            <div className="border-t border-cream-200" />
            <ToggleRow
              label="When close friends post"
              checked={notifyFriends}
              onChange={setNotifyFriends}
            />

            <p className="font-sans text-xs text-slate-hint pt-3">
              Serene only notifies you for things that matter to people, not
              metrics.
            </p>
          </div>

          {/* ================================================================ */}
          {/* Save button + feedback                                            */}
          {/* ================================================================ */}
          <div className="pt-2 space-y-3">
            <Button
              type="submit"
              className="w-full font-sans"
              disabled={isSaving || usernameStatus === "taken"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>

            {/* Inline success — fades out via state, never a toast */}
            {saveSuccess && (
              <div className="rounded-lg bg-sage-100 px-4 py-3 text-center">
                <p className="font-sans text-sm text-sage-600">
                  Changes saved
                </p>
              </div>
            )}

            {saveError && (
              <p className="font-sans text-sm text-amber-warm text-center">
                {saveError}
              </p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
