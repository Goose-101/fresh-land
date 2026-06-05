import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isValidLang, type LangCode } from "./i18n-config";
import type { Messages } from "./i18n-utils";

export { resolveKey, formatMessage, type Messages } from "./i18n-utils";

async function loadMessages(lang: LangCode): Promise<Messages> {
  try {
    const mod = await import(`@/messages/${lang}.json`);
    return mod.default || mod;
  } catch {
    const mod = await import(`@/messages/${DEFAULT_LANG}.json`);
    return mod.default || mod;
  }
}

function deepMergeFallback(primary: Messages, fallback: Messages): Messages {
  const out: Messages = Array.isArray(primary) ? [...primary] : { ...fallback };
  for (const [k, v] of Object.entries(primary)) {
    if (v && typeof v === "object" && !Array.isArray(v) && fallback[k] && typeof fallback[k] === "object") {
      out[k] = deepMergeFallback(v, fallback[k]);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function getServerLang(): Promise<LangCode> {
  const store = await cookies();
  const raw = store.get(LANG_COOKIE)?.value;
  return isValidLang(raw) ? raw : DEFAULT_LANG;
}

export async function getServerMessages(): Promise<{ lang: LangCode; messages: Messages }> {
  const lang = await getServerLang();
  const primary = await loadMessages(lang);
  if (lang === DEFAULT_LANG) return { lang, messages: primary };
  const fallback = await loadMessages(DEFAULT_LANG);
  return { lang, messages: deepMergeFallback(primary, fallback) };
}
