export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" as const },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" as const },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", dir: "ltr" as const },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" as const },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" as const },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" as const },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" as const },
];

export const DEFAULT_LANG = "en";
export const LANG_COOKIE = "language";

export type LangCode = (typeof LANGUAGES)[number]["code"];

export function isValidLang(code: string | undefined): code is LangCode {
  return !!code && LANGUAGES.some((l) => l.code === code);
}

export function getLangDir(code: string): "ltr" | "rtl" {
  return LANGUAGES.find((l) => l.code === code)?.dir ?? "ltr";
}
