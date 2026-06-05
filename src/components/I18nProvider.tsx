"use client";
import { createContext, useCallback, useContext, useMemo } from "react";
import { DEFAULT_LANG, LANG_COOKIE, LANGUAGES, type LangCode } from "@/lib/i18n-config";
import { formatMessage, resolveKey, type Messages } from "@/lib/i18n-utils";

type I18nCtx = {
  lang: LangCode;
  messages: Messages;
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string;
  setLang: (next: LangCode) => void;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  lang,
  messages,
  children,
}: {
  lang: LangCode;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>, fallback?: string) => {
      const template = resolveKey(messages, key, fallback);
      return formatMessage(template, vars);
    },
    [messages]
  );

  const setLang = useCallback((next: LangCode) => {
    document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=31536000`;
    window.location.reload();
  }, []);

  const value = useMemo(() => ({ lang, messages, t, setLang }), [lang, messages, t, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      lang: DEFAULT_LANG as LangCode,
      t: (key: string, _vars?: any, fallback?: string) => fallback ?? key,
      setLang: (_: LangCode) => {},
      messages: {} as Messages,
    };
  }
  return ctx;
}

export { LANGUAGES };
