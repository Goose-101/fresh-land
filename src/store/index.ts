"use client";
import { create } from "zustand";
import type { Profile, Notification, Resource, AIMessage, Theme } from "@/types";

export type Accessibility = {
  fontScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
};

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

export function applyAccessibility(a: Accessibility) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--font-scale", String(a.fontScale));
  root.classList.toggle("high-contrast", a.highContrast);
  root.classList.toggle("reduce-motion", a.reduceMotion);
}

type AppStore = {
  theme: Theme;
  setTheme: (t: Theme) => void;

  accessibility: Accessibility;
  setAccessibility: (a: Partial<Accessibility>) => void;

  user: Profile | null;
  setUser: (user: Profile | null) => void;

  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;

  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  unreadCount: number;
  markRead: (id: string) => void;

  savedIds: Set<string>;
  setSavedIds: (ids: string[]) => void;
  toggleSaved: (id: string) => void;

  recentResources: Resource[];
  setRecentResources: (r: Resource[]) => void;

  aiOpen: boolean;
  setAIOpen: (open: boolean) => void;
  aiMessages: AIMessage[];
  addAIMessage: (m: AIMessage) => void;
  setAIMessages: (m: AIMessage[]) => void;

  toast: { type: "success" | "error" | "info"; message: string } | null;
  showToast: (type: "success" | "error" | "info", message: string) => void;
  clearToast: () => void;

  reminderBanner: {
    id: number;
    title: string;
    body: string;
    onView?: () => void;
    onDismiss?: () => void;
  } | null;
  showReminderBanner: (
    title: string,
    body: string,
    actions?: { onView?: () => void; onDismiss?: () => void }
  ) => void;
  clearReminderBanner: () => void;

  translations: Record<string, string>;
  setTranslations: (t: Record<string, string>) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  theme: "system",
  setTheme: (theme) => {
    set({ theme });
    try { localStorage.setItem("theme", theme); } catch {}
    applyTheme(theme);
  },

  accessibility: { fontScale: 1, highContrast: false, reduceMotion: false },
  setAccessibility: (a) => {
    const next = { ...get().accessibility, ...a };
    set({ accessibility: next });
    try { localStorage.setItem("accessibility", JSON.stringify(next)); } catch {}
    applyAccessibility(next);
  },

  user: null,
  setUser: (user) => set({ user, currentLanguage: user?.preferred_language || get().currentLanguage }),

  currentLanguage: "en",
  setCurrentLanguage: (lang) => set({ currentLanguage: lang }),

  notifications: [],
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  unreadCount: 0,
  markRead: (id) => {
    const n = get().notifications.map((x) =>
      x.id === id ? { ...x, is_read: true } : x
    );
    set({ notifications: n, unreadCount: n.filter((x) => !x.is_read).length });
  },

  savedIds: new Set<string>(),
  setSavedIds: (ids) => set({ savedIds: new Set(ids) }),
  toggleSaved: (id) => {
    const s = new Set(get().savedIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    set({ savedIds: s });
  },

  recentResources: [],
  setRecentResources: (r) => set({ recentResources: r }),

  aiOpen: false,
  setAIOpen: (aiOpen) => set({ aiOpen }),
  aiMessages: [],
  addAIMessage: (m) => set({ aiMessages: [...get().aiMessages, m] }),
  setAIMessages: (aiMessages) => set({ aiMessages }),

  toast: null,
  showToast: (type, message) => {
    set({ toast: { type, message } });
    setTimeout(() => set({ toast: null }), 3500);
  },
  clearToast: () => set({ toast: null }),

  reminderBanner: null,
  showReminderBanner: (title, message, actions) => {
    const id = Date.now() + Math.random();
    set({
      reminderBanner: {
        id,
        title,
        body: message,
        onView: actions?.onView,
        onDismiss: actions?.onDismiss,
      },
    });
    // Auto-hide after 4 seconds. We DO NOT call onDismiss here, so the
    // notification stays in the unread badge counter until the user explicitly
    // clicks View → or the X. Closing the banner visually is just cosmetic.
    setTimeout(() => {
      const current = get().reminderBanner;
      if (current && current.id === id) {
        set({ reminderBanner: null });
      }
    }, 4000);
  },
  clearReminderBanner: () => set({ reminderBanner: null }),

  translations: {},
  setTranslations: (translations) => set({ translations }),
}));
