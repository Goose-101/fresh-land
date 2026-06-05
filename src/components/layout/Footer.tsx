import Link from "next/link";
import { Logo } from "./Logo";
import { getServerMessages, resolveKey, formatMessage } from "@/lib/i18n";

export async function Footer() {
  const { messages } = await getServerMessages();
  const t = (key: string, vars?: Record<string, string | number>) =>
    formatMessage(resolveKey(messages, key), vars);

  return (
    <footer className="bg-white border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 text-sm text-text-secondary max-w-xs">
            {t("footer.about")}
          </p>
        </div>
        <div>
          <h4 className="label mb-3">{t("footer.explore")}</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/resources" className="text-text-secondary hover:text-primary">{t("footer.allResources")}</Link></li>
            <li><Link href="/categories/legal" className="text-text-secondary hover:text-primary">{t("category.legal")}</Link></li>
            <li><Link href="/categories/housing" className="text-text-secondary hover:text-primary">{t("category.housing")}</Link></li>
            <li><Link href="/categories/healthcare" className="text-text-secondary hover:text-primary">{t("category.healthcare")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="label mb-3">{t("footer.account")}</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/login" className="text-text-secondary hover:text-primary">{t("action.signIn")}</Link></li>
            <li><Link href="/signup" className="text-text-secondary hover:text-primary">{t("action.signUp")}</Link></li>
            <li><Link href="/dashboard" className="text-text-secondary hover:text-primary">{t("nav.dashboard")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-text-muted">
        {t("footer.copy", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
