import { NextResponse } from "next/server";
import { translateText, translateBatch } from "@/lib/google-translate";
import { createClient } from "@/lib/supabase/server";
import {
  translateLimiter,
  checkLimit,
  getClientId,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rl = await checkLimit(translateLimiter, getClientId(req, user.id));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const body = await req.json();
  const { text, texts, targetLang, sourceLang } = body as {
    text?: string;
    texts?: string[];
    targetLang: string;
    sourceLang?: string;
  };

  if (texts?.length) {
    if (texts.length > 50) {
      return NextResponse.json({ error: "too_many_texts" }, { status: 400 });
    }
    const translated = await translateBatch(texts, targetLang, sourceLang || "en");
    return NextResponse.json({ translated }, { headers: rateLimitHeaders(rl) });
  }

  if (!text) return NextResponse.json({ error: "missing text" }, { status: 400 });
  if (text.length > 5000) {
    return NextResponse.json({ error: "text_too_long" }, { status: 400 });
  }
  const translated = await translateText(text, targetLang, sourceLang || "en");
  return NextResponse.json({ translatedText: translated }, { headers: rateLimitHeaders(rl) });
}
