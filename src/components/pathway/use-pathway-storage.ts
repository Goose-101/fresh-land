"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import type {
  OnboardingState,
  Reminder,
  TaskState,
  TaskStatus,
} from "@/lib/pathway-tasks";

const ONBOARDING_KEY = "pathway:onboarding:v1";
const TASKS_KEY = "pathway:tasks:v1";
const REMINDERS_KEY = "pathway:reminders:v1";

// Mirror a reminder to the server via the /api/reminders endpoint so the cron
// job can email at fire_at, even if the browser is closed. Visible toast on
// failure — silent on success since the local schedule already worked.
async function syncReminderToServer(r: Reminder, taskTitle: string) {
  try {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: r.id,
        taskId: r.taskId,
        taskTitle,
        fireAt: r.fireAt,
        note: r.note,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as any)?.error || `HTTP ${res.status}`;
      useAppStore.getState().showToast("error", `Email reminder didn't save: ${err}`);
    }
  } catch (e: any) {
    useAppStore
      .getState()
      .showToast("error", `Email reminder didn't save: ${e?.message || "network error"}`);
  }
}

async function deleteReminderOnServer(id: string) {
  try {
    await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  } catch {}
}

const EMPTY_ONBOARDING: OnboardingState = {
  completedAt: null,
  timeInUS: null,
  status: null,
  hasChildren: null,
};

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

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readJson<OnboardingState>(ONBOARDING_KEY, EMPTY_ONBOARDING));
    setHydrated(true);
  }, []);

  const save = useCallback((next: OnboardingState) => {
    setState(next);
    writeJson(ONBOARDING_KEY, next);
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY_ONBOARDING);
    writeJson(ONBOARDING_KEY, EMPTY_ONBOARDING);
  }, []);

  return { state, hydrated, save, reset };
}

export function useTasks() {
  const [state, setState] = useState<TaskState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readJson<TaskState>(TASKS_KEY, {}));
    setHydrated(true);
  }, []);

  const setStatus = useCallback((taskId: string, status: TaskStatus) => {
    setState((prev) => {
      const next = {
        ...prev,
        [taskId]: { status, updatedAt: new Date().toISOString() },
      };
      writeJson(TASKS_KEY, next);
      return next;
    });
  }, []);

  const bulkAlready = useCallback((ids: string[]) => {
    setState((prev) => {
      const next = { ...prev };
      const now = new Date().toISOString();
      for (const id of ids) {
        next[id] = { status: "already", updatedAt: now };
      }
      writeJson(TASKS_KEY, next);
      return next;
    });
  }, []);

  const resetMany = useCallback((ids: string[]) => {
    setState((prev) => {
      const next = { ...prev };
      for (const id of ids) delete next[id];
      writeJson(TASKS_KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState({});
    writeJson(TASKS_KEY, {});
  }, []);

  return { state, hydrated, setStatus, bulkAlready, resetMany, reset };
}

export function useReminders(onFire?: (r: Reminder) => void) {
  const [list, setList] = useState<Reminder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  const persist = useCallback((next: Reminder[]) => {
    setList(next);
    writeJson(REMINDERS_KEY, next);
  }, []);

  const fire = useCallback(
    (id: string) => {
      setList((prev) => {
        const target = prev.find((r) => r.id === id);
        if (!target || target.fired) return prev;
        const next = prev.map((r) => (r.id === id ? { ...r, fired: true } : r));
        writeJson(REMINDERS_KEY, next);
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            try {
              new Notification("Fresh Land reminder", {
                body: target.note || "You set a reminder for a pathway task.",
                icon: "/favicon.ico",
              });
            } catch {}
          }
        }
        onFireRef.current?.(target);
        return next;
      });
    },
    []
  );

  const schedule = useCallback(
    (r: Reminder) => {
      const ms = new Date(r.fireAt).getTime() - Date.now();
      if (ms <= 0) {
        fire(r.id);
        return;
      }
      const cap = Math.min(ms, 2_147_483_000);
      const t = setTimeout(() => fire(r.id), cap);
      timers.current.set(r.id, t);
    },
    [fire]
  );

  useEffect(() => {
    const initial = readJson<Reminder[]>(REMINDERS_KEY, []);
    setList(initial);
    setHydrated(true);
    for (const r of initial) {
      if (!r.fired) schedule(r);
    }
    const snapshot = timers.current;
    return () => {
      for (const t of snapshot.values()) clearTimeout(t);
      snapshot.clear();
    };
  }, [schedule]);

  const add = useCallback(
    (r: Omit<Reminder, "id" | "fired">, taskTitle?: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const full: Reminder = {
        ...r,
        id,
        fired: false,
      };
      setList((prev) => {
        const next = [...prev, full];
        writeJson(REMINDERS_KEY, next);
        return next;
      });
      schedule(full);
      // Mirror to server so the cron job can email at fire_at, even if the
      // user closes their browser. Best-effort, doesn't block the UI.
      syncReminderToServer(full, taskTitle || full.note || full.taskId);
      return full;
    },
    [schedule]
  );

  const remove = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setList((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeJson(REMINDERS_KEY, next);
      return next;
    });
    deleteReminderOnServer(id);
  }, []);

  const markViewed = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, viewed: true } : r));
      writeJson(REMINDERS_KEY, next);
      return next;
    });
  }, []);

  const markAllViewed = useCallback(() => {
    setList((prev) => {
      const next = prev.map((r) => (r.fired ? { ...r, viewed: true } : r));
      writeJson(REMINDERS_KEY, next);
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
    if (Notification.permission === "granted") return "granted" as const;
    if (Notification.permission === "denied") return "denied" as const;
    try {
      const r = await Notification.requestPermission();
      return r;
    } catch {
      return "denied" as const;
    }
  }, []);

  return { list, hydrated, add, remove, markViewed, markAllViewed, requestPermission, persist };
}