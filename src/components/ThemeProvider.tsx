"use client";
import { useEffect } from "react";
import { applyAccessibility, applyTheme, useAppStore } from "@/store";
import type { Theme } from "@/types";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme, setAccessibility, user } = useAppStore();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as Theme | null;
      const a = localStorage.getItem("accessibility");
      const theme: Theme = saved || "system";
      applyTheme(theme);
      useAppStore.setState({ theme });

      if (a) {
        const parsed = JSON.parse(a);
        useAppStore.setState({ accessibility: { fontScale: 1, highContrast: false, reduceMotion: false, ...parsed } });
        applyAccessibility({ fontScale: 1, highContrast: false, reduceMotion: false, ...parsed });
      }
    } catch {}

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (useAppStore.getState().theme === "system") applyTheme("system");
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, [setTheme, setAccessibility]);

  useEffect(() => {
    if (user?.theme && user.theme !== useAppStore.getState().theme) {
      useAppStore.setState({ theme: user.theme });
      applyTheme(user.theme);
      try { localStorage.setItem("theme", user.theme); } catch {}
    }
  }, [user?.theme]);

  return <>{children}</>;
}