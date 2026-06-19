"use client";
import Link from "next/link";
import { Logo } from "./Logo";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store";
import { LogIn, Menu } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";

export function Header({ initialSignedIn = false }: { initialSignedIn?: boolean }) {
  const { user } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useT();
  // Use server-side sign-in info as a fallback so the header doesn't flash
  // "Sign in" buttons while the client store is hydrating. If we know they're
  // signed in (server check), treat them as signed in even before the store
  // has a full profile loaded.
  const isSignedIn = !!user || initialSignedIn;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 ml-6">
          <Link href="/resources" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
            {t("nav.resources")}
          </Link>
          <Link href="/categories/legal" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
            {t("nav.categories")}
          </Link>
          {isSignedIn && (
            <>
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
                {t("nav.dashboard")}
              </Link>
              <Link href="/pathway" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
                {t("nav.pathway")}
              </Link>
              <Link href="/community" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
                {t("nav.community")}
              </Link>
              <Link href="/saved" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
                {t("nav.saved")}
              </Link>
              <Link href="/settings" className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary">
                {t("nav.settings")}
              </Link>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector />
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm">{t("nav.myDashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4" /> {t("action.signIn")}
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">{t("action.getStartedShort")}</Button>
              </Link>
            </>
          )}
          <button
            className="md:hidden p-2 rounded-btn hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("action.openMenu")}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 flex flex-col gap-1">
          <Link href="/resources" className="py-2 text-sm font-medium">{t("nav.resources")}</Link>
          <Link href="/categories/legal" className="py-2 text-sm font-medium">{t("nav.categories")}</Link>
          {isSignedIn && (
            <>
              <Link href="/dashboard" className="py-2 text-sm font-medium">{t("nav.dashboard")}</Link>
              <Link href="/pathway" className="py-2 text-sm font-medium">{t("nav.pathway")}</Link>
              <Link href="/community" className="py-2 text-sm font-medium">{t("nav.community")}</Link>
              <Link href="/saved" className="py-2 text-sm font-medium">{t("nav.saved")}</Link>
              <Link href="/settings" className="py-2 text-sm font-medium">{t("nav.settings")}</Link>
            </>
          )}
          {!isSignedIn && <Link href="/login" className="py-2 text-sm font-medium">{t("action.signIn")}</Link>}
        </div>
      )}
    </header>
  );
}
