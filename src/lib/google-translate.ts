import { createAdminClient } from "./supabase/server";

const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en"
): Promise<string> {
  if (!text || targetLang === sourceLang) return text;

  try {
    const supabase = await createAdminClient();
    const { data: cached } = await supabase
      .from("translation_cache")
      .select("translated_text")
      .eq("source_text", text)
      .eq("source_lang", sourceLang)
      .eq("target_lang", targetLang)
      .maybeSingle();
    if (cached?.translated_text) return cached.translated_text;

    const key = process.env.GOOGLE_TRANSLATION_API_KEY;
    if (!key) return text;

    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text",
      }),
    });

    if (!res.ok) return text;
    const json = await res.json();
    const translated: string =
      json?.data?.translations?.[0]?.translatedText || text;

    await supabase.from("translation_cache").insert({
      source_text: text,
      source_lang: sourceLang,
      target_lang: targetLang,
      translated_text: translated,
    });

    return translated;
  } catch {
    return text;
  }
}

export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = "en"
): Promise<string[]> {
  return Promise.all(texts.map((t) => translateText(t, targetLang, sourceLang)));
}

export async function translatePage(
  strings: Record<string, string>,
  targetLang: string,
  sourceLang: string = "en"
): Promise<Record<string, string>> {
  const keys = Object.keys(strings);
  const values = Object.values(strings);
  const translated = await translateBatch(values, targetLang, sourceLang);
  return Object.fromEntries(keys.map((k, i) => [k, translated[i]]));
}
