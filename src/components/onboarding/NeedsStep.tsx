"use client";
import { Scale, Home, Briefcase, Heart, BookOpen, DollarSign, AlertCircle, Users, Trees, Bus, UtensilsCrossed, Baby, Church, Library, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

const CATEGORIES = [
  { slug: "legal", Icon: Scale },
  { slug: "housing", Icon: Home },
  { slug: "employment", Icon: Briefcase },
  { slug: "healthcare", Icon: Heart },
  { slug: "education", Icon: BookOpen },
  { slug: "financial", Icon: DollarSign },
  { slug: "emergency", Icon: AlertCircle },
  { slug: "community", Icon: Users },
  { slug: "parks", Icon: Trees },
  { slug: "transportation", Icon: Bus },
  { slug: "food", Icon: UtensilsCrossed },
  { slug: "family", Icon: Baby },
  { slug: "faith", Icon: Church },
  { slug: "libraries", Icon: Library },
  { slug: "womens", Icon: HeartHandshake },
];

export function NeedsStep({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useT();
  const toggle = (slug: string) =>
    onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {CATEGORIES.map(({ slug, Icon }) => {
        const active = value.includes(slug);
        return (
          <button
            key={slug}
            type="button"
            onClick={() => toggle(slug)}
            className={cn(
              "flex items-center gap-3 bg-white rounded-card border p-4 text-left transition hover:border-primary",
              active ? "border-primary ring-2 ring-primary/20 bg-primary-light" : "border-border"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-btn grid place-items-center shrink-0",
              active ? "bg-primary text-white" : "bg-primary-light text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">{t(`category.${slug}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
