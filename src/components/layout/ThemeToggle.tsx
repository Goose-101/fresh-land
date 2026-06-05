"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { createClient } from "@/lib/supabase/client";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme, user, setUser } = useAppStore();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setIsDark(document.documentElement.classList.contains("dark"));
  }, [theme]);

  const onToggle = async () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    if (user) {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .update({ theme: next })
        .eq("id", user.id)
        .select()
        .single();
      if (data) setUser(data);
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`p-2 rounded-btn hover:bg-slate-100 dark:hover:bg-slate-800 transition ${className}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}