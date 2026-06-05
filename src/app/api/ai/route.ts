import { NextResponse } from "next/server";
import {
  generateText,
  streamText,
  SYSTEM_PROMPT,
  GUIDED_SYSTEM_PROMPT,
} from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import {
  aiChatLimiter,
  aiGuidedLimiter,
  checkLimit,
  getClientId,
  rateLimitHeaders,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

type ChatBody = {
  mode: "chat";
  message: string;
  language?: string;
  sessionId?: string;
  userContext?: { city?: string; needs?: string[] };
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
};

type GuidedBody = {
  mode: "guided";
  history: { role: "user" | "assistant"; content: string }[];
  language?: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody | GuidedBody;

  const supabaseEarly = await createClient();
  const {
    data: { user: earlyUser },
  } = await supabaseEarly.auth.getUser();
  const clientId = getClientId(req, earlyUser?.id);

  if (body.mode === "guided") {
    const rl = await checkLimit(aiGuidedLimiter, clientId);
    if (!rl.ok) {
      return NextResponse.json(
        {
          step: {
            done: false,
            question: "You've reached the request limit. Please wait a few minutes and try again.",
          },
        },
        { status: 429, headers: rateLimitHeaders(rl) }
      );
    }
    try {
      const history =
        body.history.length > 0
          ? body.history
          : [{ role: "user" as const, content: "Begin the intake." }];
      const text = await generateText({
        system: `${GUIDED_SYSTEM_PROMPT}\nRespond in language code: ${body.language || "en"}.`,
        history,
        maxTokens: 400,
      });
      let step: any = { done: false, question: "What do you need help with?" };
      try {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) step = JSON.parse(m[0]);
      } catch {}
      return NextResponse.json({ step }, { headers: rateLimitHeaders(rl) });
    } catch (e: any) {
      console.error("[AI guided error]", e?.message);
      return NextResponse.json({
        step: {
          done: false,
          question: "What do you need help with?",
          suggestions: ["Legal help", "Housing", "Healthcare", "Jobs", "Emergency"],
        },
      });
    }
  }

  const chatRl = await checkLimit(aiChatLimiter, clientId);
  if (!chatRl.ok) {
    return new Response(
      "You've reached the message limit for this hour. Please wait and try again.",
      {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          ...rateLimitHeaders(chatRl),
        },
      }
    );
  }

  const { message, language, sessionId, userContext, conversationHistory } = body;

  const supabase = supabaseEarly;
  const user = earlyUser;

  if (user && sessionId) {
    await supabase.from("ai_conversations").insert({
      user_id: user.id,
      session_id: sessionId,
      role: "user",
      content: message,
      language: language || "en",
    });
  }

  const encoder = new TextEncoder();
  const outStream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        const stream = await streamText({
          system: SYSTEM_PROMPT({
            city: userContext?.city,
            needs: userContext?.needs,
            language,
          }),
          history: [
            ...(conversationHistory || []),
            { role: "user" as const, content: message },
          ],
          maxTokens: 800,
        });

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          full += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        if (user && sessionId && full) {
          await supabase.from("ai_conversations").insert({
            user_id: user.id,
            session_id: sessionId,
            role: "assistant",
            content: full,
            language: language || "en",
          });
        }
      } catch (e: any) {
        console.error("[AI chat error]", e?.message);
        const msg = e?.message?.includes("GEMINI_API_KEY missing")
          ? "Gemini API key not configured. Add GEMINI_API_KEY to .env.local."
          : e?.message?.includes("401") || e?.message?.includes("403")
          ? "Gemini API key is invalid. Regenerate at aistudio.google.com/app/apikey."
          : e?.message?.includes("429")
          ? "Gemini rate limit hit — wait a minute and try again."
          : `AI error: ${e?.message || "unknown"}`;
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(outStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      ...rateLimitHeaders(chatRl),
    },
  });
}
