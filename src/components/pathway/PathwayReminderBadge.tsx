"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAppStore } from "@/store";
import type { Reminder, TaskState } from "@/lib/pathway-tasks";

// Match the user-scoped key scheme in use-pathway-storage.ts.
const remindersKey = (uid: string | null) =>
  `pathway:reminders:v1${uid ? ":" + uid : ""}`;
const tasksKey = (uid: string | null) =>
  `pathway:tasks:v1${uid ? ":" + uid : ""}`;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function compute(uid: string | null): number {
  if (!uid) return 0;
  const reminders = readJson<Reminder[]>(remindersKey(uid), []);
  const tasks = readJson<TaskState>(tasksKey(uid), {});
  return reminders.filter((r) => {
    if (!r.fired || r.viewed) return false;
    const status = tasks[r.taskId]?.status;
    return status !== "done" && status !== "already";
  }).length;
}

export function usePathwayReminderCount() {
  const userId = useAppStore((s) => s.user?.id || null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(compute(userId));
    const rKey = remindersKey(userId);
    const tKey = tasksKey(userId);
    const onStorage = (e: StorageEvent) => {
      if (e.key === rKey || e.key === tKey) setCount(compute(userId));
    };
    const interval = setInterval(() => setCount(compute(userId)), 5000);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [userId]);

  return count;
}

export function PathwayReminderBadge() {
  const count = usePathwayReminderCount();
  if (count === 0) return null;

  return (
    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 text-primary-dark rounded-pill px-2.5 py-1 shadow-sm pointer-events-none">
      <Bell className="h-3.5 w-3.5" />
      <span className="min-w-[18px] h-[18px] grid place-items-center rounded-full bg-primary text-white text-[10px] font-bold leading-none px-1">
        {count > 9 ? "9+" : count}
      </span>
    </div>
  );
}