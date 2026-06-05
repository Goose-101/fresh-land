"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { Reminder, TaskState } from "@/lib/pathway-tasks";

const REMINDERS_KEY = "pathway:reminders:v1";
const TASKS_KEY = "pathway:tasks:v1";

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

function compute(): number {
  const reminders = readJson<Reminder[]>(REMINDERS_KEY, []);
  const tasks = readJson<TaskState>(TASKS_KEY, {});
  return reminders.filter((r) => {
    if (!r.fired || r.viewed) return false;
    const status = tasks[r.taskId]?.status;
    return status !== "done" && status !== "already";
  }).length;
}

export function usePathwayReminderCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(compute());
    const onStorage = (e: StorageEvent) => {
      if (e.key === REMINDERS_KEY || e.key === TASKS_KEY) setCount(compute());
    };
    const interval = setInterval(() => setCount(compute()), 5000);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

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