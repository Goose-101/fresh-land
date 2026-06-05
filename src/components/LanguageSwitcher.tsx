"use client";
import { LANGUAGES } from "@/lib/i18n-config";
import { useT } from "@/components/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useT();

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-x-1 gap-y-1 text-sm">
      {LANGUAGES.map((l, i) => (
        <span key={l.code} className="inline-flex items-center">
          <button
            type="button"
            onClick={() => setLang(l.code)}
            className={cn(
              "px-2 py-0.5 rounded-pill transition",
              lang === l.code
                ? "bg-primary text-white font-medium"
                : "text-text-secondary hover:text-primary hover:underline"
            )}
            aria-pressed={lang === l.code}
          >
            {l.nativeName}
          </button>
          {i < LANGUAGES.length - 1 && (
            <span className="text-text-muted mx-1">·</span>
          )}
        </span>
      ))}
    </div>
  );
}
