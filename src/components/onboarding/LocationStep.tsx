"use client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { useT } from "@/components/I18nProvider";

const CITY_KEYS = ["Atlanta", "Clarkston", "Norcross", "Decatur", "Marietta"];

export function LocationStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useT();
  const cities = [...CITY_KEYS, t("onboarding.cityOther")];
  const otherLabel = t("onboarding.cityOther");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {cities.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c === otherLabel ? "" : c)}
            className={cn(
              "rounded-pill border px-4 py-2 text-sm font-medium transition",
              value === c ? "bg-primary text-white border-primary" : "bg-white border-border hover:bg-primary-light"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <Input
        label={t("onboarding.orType")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("onboarding.typeCityPlaceholder")}
      />
    </div>
  );
}
