"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/components/I18nProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">{t("errors.title")}</h1>
        <p className="text-muted mb-6">{t("errors.body")}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-btn bg-primary text-white font-medium hover:bg-primary/90"
          >
            {t("errors.tryAgain")}
          </button>
          <Link
            href="/"
            className="px-5 py-2 rounded-btn border border-border font-medium hover:bg-muted/10"
          >
            {t("errors.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
