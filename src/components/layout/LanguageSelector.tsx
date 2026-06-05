"use client";
import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { useAppStore } from "@/store";
import { LANGUAGES } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/I18nProvider";
import type { LangCode } from "@/lib/i18n-config";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { currentLanguage, setCurrentLanguage, user, setUser } = useAppStore();
  const { setLang } = useT();
  const [open, setOpen] = useState(false);

  const onSelect = async (code: string) => {
    setCurrentLanguage(code);
    setOpen(false);
    if (user) {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ preferred_language: code })
        .eq("id", user.id);
      setUser({ ...user, preferred_language: code });
    }
    // Persists the cookie AND reloads so server components re-render in the
    // new language. Without this, only client UI updates — server-rendered
    // text stays in the old language.
    setLang(code as LangCode);
  };

  const current = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-2 rounded-btn border border-border bg-white hover:bg-primary-light transition text-sm",
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        )}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 text-primary" />
        <span className="font-medium">{current.nativeName}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[200px] bg-white rounded-card shadow-modal border border-border py-1 animate-fade-in">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => onSelect(l.code)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-primary-light text-sm"
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium">{l.nativeName}</span>
                  <span className="text-xs text-text-muted">{l.name}</span>
                </span>
                {currentLanguage === l.code && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
