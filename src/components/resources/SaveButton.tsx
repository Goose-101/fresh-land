"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store";
import { createClient } from "@/lib/supabase/client";
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
  const { user, savedIds, toggleSaved, showToast } = useAppStore();
  const [signInModal, setSignInModal] = useState(false);
  const saved = savedIds.has(resourceId);

  const onToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return setSignInModal(true);

    toggleSaved(resourceId);
    const supabase = createClient();

    if (saved) {
      const { error } = await supabase
        .from("saved_resources")
        .delete()
        .eq("user_id", user.id)
        .eq("resource_id", resourceId);
      if (error) {
        toggleSaved(resourceId);
        showToast("error", "Could not remove. Try again.");
      } else {
        await supabase.rpc("decrement_save_count", { r_id: resourceId }).throwOnError().then(() => {}, () => {});
      }
    } else {
      const { error } = await supabase
        .from("saved_resources")
        .insert({ user_id: user.id, resource_id: resourceId });
      if (error) {
        toggleSaved(resourceId);
        showToast("error", "Could not save. Try again.");
      } else {
        showToast("success", "Saved to your resources");
      }
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
