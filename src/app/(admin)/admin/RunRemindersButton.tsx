"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store";
import { Bell } from "lucide-react";

export function RunRemindersButton() {
  const { showToast } = useAppStore();
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/reminders", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", json?.error || "Reminder run failed.");
        return;
      }
      const { processed, sent, errors } = json as {
        processed: number;
        sent: number;
        errors: string[];
      };
      if (errors?.length) {
        const firstError = errors[0]?.split(":").slice(1).join(":").trim() || errors[0];
        showToast("error", `Processed ${processed}, sent ${sent}. ${firstError}`);
      } else {
        showToast("success", `Processed ${processed}, sent ${sent}.`);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button variant="outline" onClick={run} loading={running}>
      <Bell className="h-4 w-4" /> Run reminders now
    </Button>
  );
}
