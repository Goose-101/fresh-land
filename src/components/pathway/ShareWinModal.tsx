"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store";
import type { PathwayTask } from "@/lib/pathway-tasks";

export function ShareWinModal({
  open,
  task,
  categoryIdBySlug,
  onClose,
}: {
  open: boolean;
  task: PathwayTask | null;
  categoryIdBySlug: Record<string, string>;
  onClose: () => void;
}) {
  const { t } = useT();
  const { user, currentLanguage, showToast } = useAppStore();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!task) return null;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 100;
  const taskTitle = t(task.titleKey, undefined, task.fallbackTitle);

  const submit = async () => {
    if (!user || !text.trim() || overLimit) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      title: `I just completed: ${taskTitle}`,
      content: text.trim(),
      category_id: categoryIdBySlug[task.category] || null,
      language: currentLanguage,
    });
    setSending(false);
    if (error) {
      showToast("error", t("pathway.share.failed", undefined, "Could not post your win."));
      return;
    }
    setText("");
    onClose();
    showToast("success", t("pathway.share.posted", undefined, "Your win is live in the Community."));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pathway.share.title", undefined, "Share your win")}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-card border border-primary/30 bg-primary-light/40 px-3 py-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-primary-dark">
              {t("pathway.share.celebrate", undefined, "Way to go!")}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {t(
                "pathway.share.body",
                { title: taskTitle },
                `You completed "${taskTitle}". Sharing your story helps others know it's possible.`
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {t("pathway.share.story", undefined, "What helped most?")}
            </label>
            <span
              className={
                overLimit
                  ? "text-xs text-red-600"
                  : wordCount > 85
                  ? "text-xs text-amber-600"
                  : "text-xs text-text-muted"
              }
            >
              {wordCount} / 100
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={t(
              "pathway.share.placeholder",
              undefined,
              "Share what helped, or who supported you. Keep it short — just enough to encourage someone."
            )}
            className={`w-full rounded-btn border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white resize-y ${
              overLimit ? "border-red-300 focus:ring-red-300/40" : "border-border focus:ring-primary/30"
            }`}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("pathway.share.skip", undefined, "Maybe later")}
          </Button>
          <Button
            onClick={submit}
            disabled={!text.trim() || overLimit}
            loading={sending}
            className="ml-auto"
          >
            <Send className="h-4 w-4" />
            {t("pathway.share.publish", undefined, "Post to Community")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}