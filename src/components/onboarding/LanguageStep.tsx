"use client";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/types";

export function LanguageStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          className={cn(
            "flex flex-col items-start justify-between text-left bg-white rounded-card border p-4 h-28 hover:border-primary transition",
            value === l.code ? "border-primary ring-2 ring-primary/20" : "border-border"
          )}
        >
          <span className="text-xl font-semibold">{l.nativeName}</span>
          <span className="text-xs text-text-muted">{l.name}</span>
        </button>
      ))}
    </div>
  );
}
