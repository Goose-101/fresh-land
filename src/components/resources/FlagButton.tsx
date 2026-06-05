"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store";

const REASONS = [
  "Phone number is wrong",
  "Address is wrong",
  "Organization is closed",
  "Service no longer offered",
  "Other",
];

export function FlagButton({ resourceId }: { resourceId: string }) {
  const { showToast } = useAppStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flag", resourceId, reason }),
      });
      showToast("success", "Thanks — we'll review this.");
      setOpen(false);
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-error"
      >
        <Flag className="h-3.5 w-3.5" /> Flag as outdated
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Flag as outdated">
        <p className="text-sm text-text-secondary mb-4">
          Help us keep Fresh Land accurate. What's wrong?
        </p>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="flag-reason"
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              {r}
            </label>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!reason} loading={submitting} className="ml-auto">
            Submit
          </Button>
        </div>
      </Modal>
    </>
  );
}
