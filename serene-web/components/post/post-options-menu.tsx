"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MoodTagSelector } from "@/components/post/mood-tag-selector";
import type { MoodTag } from "@/types/database";

interface PostOptionsMenuProps {
  postId: string;
  postOwnerId: string;
  currentUserId: string | null | undefined;
  caption: string | null;
  moodTag: string | null;
  onDeleted: () => void;
  onEdited: (caption: string, moodTag: string) => void;
}

export function PostOptionsMenu({
  postId,
  postOwnerId,
  currentUserId,
  caption,
  moodTag,
  onDeleted,
  onEdited,
}: PostOptionsMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption ?? "");
  const [draftMood, setDraftMood] = useState<MoodTag | null>(
    (moodTag as MoodTag | null) ?? null
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraftCaption(caption ?? "");
      setDraftMood((moodTag as MoodTag | null) ?? null);
    }
  }, [caption, moodTag, editing]);

  useEffect(() => {
    if (!menuOpen || editing || confirmDelete) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen, editing, confirmDelete]);

  if (!currentUserId || postOwnerId !== currentUserId) {
    return null;
  }

  async function handleSave() {
    const nextMood = draftMood ?? ((moodTag as MoodTag | null) ?? null);
    if (!nextMood) {
      setError("Choose a mood for this post.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: draftCaption.trim(),
          mood_tag: nextMood,
        }),
      });
      if (!res.ok) {
        setError("Could not save changes.");
        return;
      }
      onEdited(draftCaption.trim(), nextMood);
      setEditing(false);
      setMenuOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Could not delete post.");
        return;
      }
      onDeleted();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
      setMenuOpen(false);
    }
  }

  if (editing) {
    return (
      <div
        ref={rootRef}
        className="w-full space-y-3 rounded-xl border border-white/[0.08] bg-[#222220]/80 p-3"
      >
        <Textarea
          value={draftCaption}
          onChange={(e) => setDraftCaption(e.target.value.slice(0, 300))}
          rows={4}
          className="resize-y border-white/[0.08] bg-transparent text-sm text-white/80 placeholder:text-white/25"
          placeholder="Caption…"
          aria-label="Edit caption"
        />
        <MoodTagSelector value={draftMood} onChange={setDraftMood} />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="font-sans"
            style={{
              background: "linear-gradient(135deg, #5E9A52, #3A6032)",
              color: "#F5F0E8",
            }}
            disabled={saving}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-sans text-white/50"
            disabled={saving}
            onClick={() => {
              setEditing(false);
              setMenuOpen(false);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
        {error && <p className="font-sans text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (confirmDelete) {
    return (
      <div
        ref={rootRef}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.08] bg-[#222220] px-3 py-2"
      >
        <span className="font-sans text-xs text-white/60">Delete this post?</span>
        <button
          type="button"
          className="font-sans text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
          disabled={deleting}
          onClick={() => void handleConfirmDelete()}
        >
          Yes, delete
        </button>
        <button
          type="button"
          className="font-sans text-xs text-white/40 hover:text-white/60"
          disabled={deleting}
          onClick={() => setConfirmDelete(false)}
        >
          Cancel
        </button>
        {error && <span className="w-full font-sans text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        type="button"
        aria-label="Post options"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-300"
      >
        <MoreHorizontal size={18} aria-hidden />
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-white/[0.08] bg-[#222220] py-1 shadow-2xl"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm text-white/75 transition-colors hover:bg-white/[0.04]"
            onClick={() => {
              setMenuOpen(false);
              setEditing(true);
            }}
          >
            <Pencil size={14} className="text-white/40" aria-hidden />
            Edit post
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm text-white/75 transition-colors hover:bg-white/[0.04]"
            onClick={() => {
              setMenuOpen(false);
              setConfirmDelete(true);
            }}
          >
            <Trash2 size={14} className="text-white/40" aria-hidden />
            Delete post
          </button>
        </div>
      )}
    </div>
  );
}
