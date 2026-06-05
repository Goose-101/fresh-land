"use client";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";

export default function NotFound() {
  const { t } = useT();
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">{t("errors.notFoundTitle")}</h1>
        <p className="text-muted mb-6">{t("errors.notFoundBody")}</p>
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-btn bg-primary text-white font-medium hover:bg-primary/90"
        >
          {t("errors.goHome")}
        </Link>
      </div>
    </div>
  );
}
