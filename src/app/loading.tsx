"use client";
import { useT } from "@/components/I18nProvider";

export default function Loading() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex items-center gap-3 text-muted">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>{t("errors.loading", undefined, "Loading…")}</span>
      </div>
    </div>
  );
}
