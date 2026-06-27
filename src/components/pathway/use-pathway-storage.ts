"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store";
import type {
  OnboardingState,
  Reminder,
  TaskState,
  TaskStatus,
} from "@/lib/pathway-tasks";

// Pathway data is per-user — keys are namespaced with the signed-in user's ID
// so two people sharing a browser (or one user signing in/out as another)
// never see each other's reminders, tasks, or onboarding state.
const onboardingKey = (uid: string | null) =>
  `pathway:onboarding:v1${uid ? ":" + uid : ""}`;
const tasksKey = (uid: string | null) =>
  `pathway:tasks:v1${uid ? ":" + uid : ""}`;
const remindersKey = (uid: string | null) =>
  `pathway:reminders:v1${uid ? ":" + uid : ""}`;

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
  const userId = useAppStore((s) => s.user?.id || null);
  const key = useMemo(() => onboardingKey(userId), [userId]);
  const [state, setState] = useState<OnboardingState>(EMPTY_ONBOARDING);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readJson<OnboardingState>(key, EMPTY_ONBOARDING));
    setHydrated(true);
  }, [key]);

  const save = useCallback(
    (next: OnboardingState) => {
      setState(next);
      writeJson(key, next);
    },
    [key]
  );

  const reset = useCallback(() => {
    setState(EMPTY_ONBOARDING);
    writeJson(key, EMPTY_ONBOARDING);
  }, [key]);

  return { state, hydrated, save, reset };
}

export function useTasks() {
  const userId = useAppStore((s) => s.user?.id || null);
  const key = useMemo(() => tasksKey(userId), [userId]);
  const [state, setState] = useState<TaskState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readJson<TaskState>(key, {}));
    setHydrated(true);
  }, [key]);

  const setStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      setState((prev) => {
        const next = {
          ...prev,
          [taskId]: { status, updatedAt: new Date().toISOString() },
        };
        writeJson(key, next);
        return next;
      });
    },
    [key]
  );

  const bulkAlready = useCallback(
    (ids: string[]) => {
      setState((prev) => {
        const next = { ...prev };
        const now = new Date().toISOString();
        for (const id of ids) {
          next[id] = { status: "already", updatedAt: now };
        }
        writeJson(key, next);
        return next;
      });
    },
    [key]
  );

  const resetMany = useCallback(
    (ids: string[]) => {
      setState((prev) => {
        const next = { ...prev };
        for (const id of ids) delete next[id];
        writeJson(key, next);
        return next;
      });
    },
    [key]
  );

  const reset = useCallback(() => {
    setState({});
    writeJson(key, {});
  }, [key]);

  return { state, hydrated, setStatus, bulkAlready, resetMany, reset };
}

export function useReminders(onFire?: (r: Reminder) => void) {
  const userId = useAppStore((s) => s.user?.id || null);
  const key = useMemo(() => remindersKey(userId), [userId]);
  const [list, setList] = useState<Reminder[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  const persist = useCallback(
    (next: Reminder[]) => {
      setList(next);
      writeJson(key, next);
    },
    [key]
  );

  const fire = useCallback(
    (id: string) => {
      setList((prev) => {
        const target = prev.find((r) => r.id === id);
        if (!target || target.fired) return prev;
        const next = prev.map((r) => (r.id === id ? { ...r, fired: true } : r));
        writeJson(key, next);
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
    [key]
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
    const initial = readJson<Reminder[]>(key, []);
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
  }, [key, schedule]);

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
        writeJson(key, next);
        return next;
      });
      schedule(full);
      syncReminderToServer(full, taskTitle || full.note || full.taskId);
      return full;
    },
    [schedule, key]
  );

  const remove = useCallback(
    (id: string) => {
      const t = timers.current.get(id);
      if (t) {
        clearTimeout(t);
        timers.current.delete(id);
      }
      setList((prev) => {
        const next = prev.filter((r) => r.id !== id);
        writeJson(key, next);
        return next;
      });
      deleteReminderOnServer(id);
    },
    [key]
  );

  const markViewed = useCallback(
    (id: string) => {
      setList((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, viewed: true } : r));
        writeJson(key, next);
        return next;
      });
    },
    [key]
  );

  const markAllViewed = useCallback(() => {
    setList((prev) => {
      const next = prev.map((r) => (r.fired ? { ...r, viewed: true } : r));
      writeJson(key, next);
      return next;
    });
  }, [key]);

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