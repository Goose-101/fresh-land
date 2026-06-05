"use client";
import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useT } from "@/components/I18nProvider";
import type { PathwayTask, Reminder } from "@/lib/pathway-tasks";

function nextDefault(): { date: string; time: string } {
  // Default to ~10 minutes from now so reminders are immediately useful and
  // never silently rejected for being "in the past".
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function ReminderModal({
  open,
  task,
  existing,
  onClose,
  onSave,
  onRemove,
  onRequestPermission,
}: {
  open: boolean;
  task: PathwayTask | null;
  existing: Reminder[];
  onClose: () => void;
  onSave: (r: Omit<Reminder, "id" | "fired">) => void;
  onRemove: (id: string) => void;
  onRequestPermission: () => Promise<NotificationPermission | "unsupported">;
}) {
  const { t } = useT();
  const defaults = useMemo(nextDefault, [open]);
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [note, setNote] = useState("");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !task) return;
    setDate(defaults.date);
    setTime(defaults.time);
    setNote(t(task.titleKey, undefined, task.fallbackTitle));
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, [open, task, defaults.date, defaults.time, t]);

  if (!task) return null;

  const handleSave = async () => {
    setError(null);
    const fireAt = new Date(`${date}T${time}:00`).toISOString();
    if (Number.isNaN(new Date(fireAt).getTime())) {
      setError(t("pathway.reminder.invalid", undefined, "Pick a valid date and time."));
      return;
    }
    if (new Date(fireAt).getTime() <= Date.now()) {
      setError(
        t(
          "pathway.reminder.past",
          undefined,
          "That time has already passed. Pick a date and time in the future."
        )
      );
      return;
    }
    if (permission === "default") {
      const next = await onRequestPermission();
      setPermission(next);
    }
    onSave({ taskId: task.id, fireAt, note: note.trim() || t(task.titleKey, undefined, task.fallbackTitle) });
    onClose();
  };

  const quickTest = (seconds: number) => {
    setError(null);
    const fireAt = new Date(Date.now() + seconds * 1000).toISOString();
    onSave({
      taskId: task.id,
      fireAt,
      note:
        note.trim() ||
        t("pathway.reminder.testNote", undefined, `Test reminder for ${task.fallbackTitle}`),
    });
    onClose();
  };

  const taskReminders = existing.filter((r) => r.taskId === task.id && !r.fired);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pathway.reminder.title", undefined, "Set a reminder")}
      size="md"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-border bg-primary-light/40 px-3 py-2.5">
          <p className="text-xs text-text-muted">
            {t("pathway.reminder.for", undefined, "Reminder for")}
          </p>
          <p className="text-sm font-medium">
            {t(task.titleKey, undefined, task.fallbackTitle)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {t("pathway.reminder.date", undefined, "Date")}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              {t("pathway.reminder.time", undefined, "Time")}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            {t("pathway.reminder.note", undefined, "Note (optional)")}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-btn border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {permission === "denied" && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-btn px-3 py-2 inline-flex items-start gap-2">
            <BellOff className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {t(
              "pathway.reminder.denied",
              undefined,
              "Notifications are blocked in your browser. We'll still show reminders inside Fresh Land."
            )}
          </p>
        )}
        {permission === "unsupported" && (
          <p className="text-xs text-text-muted bg-slate-50 border border-border rounded-btn px-3 py-2">
            {t(
              "pathway.reminder.unsupported",
              undefined,
              "Your browser doesn't support notifications. Reminders will appear when Fresh Land is open."
            )}
          </p>
        )}
        {permission === "default" && (
          <p className="text-xs text-text-secondary bg-primary-light/40 rounded-btn px-3 py-2 inline-flex items-start gap-2">
            <Bell className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            {t(
              "pathway.reminder.willAsk",
              undefined,
              "We'll ask permission to send a browser notification at that time."
            )}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-btn px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <span className="text-xs text-text-muted self-center mr-1">
            {t("pathway.reminder.quickTest", undefined, "Quick test:")}
          </span>
          <button
            type="button"
            onClick={() => quickTest(15)}
            className="text-xs rounded-btn border border-border px-2 py-1 hover:border-primary"
          >
            15s
          </button>
          <button
            type="button"
            onClick={() => quickTest(60)}
            className="text-xs rounded-btn border border-border px-2 py-1 hover:border-primary"
          >
            1 min
          </button>
        </div>

        {taskReminders.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="text-xs font-medium text-text-secondary mb-2">
              {t("pathway.reminder.upcoming", undefined, "Upcoming reminders")}
            </p>
            <ul className="flex flex-col gap-2">
              {taskReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-btn border border-border px-3 py-2 text-sm"
                >
                  <span>{new Date(r.fireAt).toLocaleString()}</span>
                  <button
                    onClick={() => onRemove(r.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    {t("action.delete", undefined, "Remove")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <Button variant="ghost" onClick={onClose}>
            {t("action.cancel", undefined, "Cancel")}
          </Button>
          <Button onClick={handleSave} className="ml-auto">
            <Bell className="h-4 w-4" />
            {t("pathway.reminder.save", undefined, "Save reminder")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}