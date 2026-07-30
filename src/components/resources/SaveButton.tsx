"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function SaveButton({
  resourceId,
  className,
  showLabel = false,
}: {
  resourceId: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { savedIds, toggleSaved, showToast } = useAppStore();
  const [signInModal, setSignInModal] = useState(false);
  const saved = savedIds.has(resourceId);

  const onToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically flip the heart, then persist via a server endpoint. The
    // server reads the login session from cookies (reliable), so saving works
    // even when the browser can't read the session locally. If the save fails
    // we revert the heart so it never lies about what's actually stored.
    const wasSaved = saved;
    toggleSaved(resourceId);

    try {
      const res = wasSaved
        ? await fetch(`/api/saved?resourceId=${encodeURIComponent(resourceId)}`, { method: "DELETE" })
        : await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resourceId }),
          });

      if (res.status === 401) {
        toggleSaved(resourceId);
        return setSignInModal(true);
      }
      if (!res.ok) {
        toggleSaved(resourceId);
        showToast("error", wasSaved ? "Could not remove. Try again." : "Could not save. Try again.");
        return;
      }
      if (!wasSaved) showToast("success", "Saved to your resources");
    } catch {
      toggleSaved(resourceId);
      showToast("error", "Something went wrong. Try again.");
    }
  };

  return (
    <>
      <button
        onClick={onToggle}
        aria-label={saved ? "Remove from saved" : "Save resource"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-btn transition",
          saved ? "bg-red-50 text-red-600" : "bg-white border border-border text-text-secondary hover:bg-slate-50",
          showLabel ? "px-3 py-2 text-sm font-medium" : "p-2",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        {showLabel && (saved ? "Saved" : "Save")}
      </button>

      <Modal open={signInModal} onClose={() => setSignInModal(false)} title="Sign in to save">
        <p className="text-sm text-text-secondary">
          Create a free account to save resources and come back to them anytime.
        </p>
        <div className="mt-5 flex gap-2">
          <Link href="/signup" className="flex-1">
            <Button variant="primary" fullWidth>Create free account</Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="outline" fullWidth>Sign in</Button>
          </Link>
        </div>
      </Modal>
    </>
  );
}
