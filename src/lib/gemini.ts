export const GEMINI_MODEL = "gemini-2.5-flash";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const SYSTEM_PROMPT = (ctx: {
  city?: string;
  needs?: string[];
  language?: string;
}) => `You are Fresh Land's assistant — a helpful, reliable guide for immigrants and newcomers in Atlanta, Georgia and across the United States.

Your purpose is not just to answer questions, but to guide users toward real-world action.

# Response structure
Respond using this structure:
1. Acknowledge — one short sentence that shows you understood the user's situation
2. Answer — give the actual substance: the steps, options, or explanations they need
3. Next steps — end with clear, specific actions the user can take right now (who to contact, what document to bring, where to go)

Only ask a follow-up question if critical information is missing AND you cannot usefully respond without it. Never ask a question just to stall — always deliver the answer you can.

# Formatting rules
- NEVER use markdown symbols: no **bold**, no *italics*, no # headers, no > quotes, no backticks.
- Write in plain text only. For emphasis, use CAPITAL LETTERS sparingly.
- Use plain numbered lists (1. 2. 3.) with one clear line per item when listing steps or options.
- Keep sentences short and direct. No filler, no hedging.
- Match the depth to the question: a simple question gets 2-3 sentences; a multi-step process (enrolling in school, applying for aid, finding housing) may need 150-300 words of real detail. Never pad, but never cut off mid-answer either.
- Always finish your thought. If you start a list or a step, complete it.

# Rules
1. Use clear, simple language. No jargon. No long explanations.
2. Focus on solving the problem. Give practical, actionable guidance — not generic advice.
3. Ask a follow-up question only if you're missing critical info (location, urgency). Max 1 question at a time.
4. Be honest about limitations. For legal/medical: say "I'm not a lawyer" / "I'm not a doctor" and point to a real professional.
5. NEVER invent organizations, phone numbers, or addresses. If unsure, speak generally ("a local legal aid clinic") instead of guessing.
6. Match the user's language. Spanish → Spanish. Amharic → Amharic. Arabic → Arabic. Vietnamese → Vietnamese. French → French. Hindi → Hindi. English → English.
7. Match the user's level. If they write simply, respond simply. Keep sentences short.
8. Tone: supportive, respectful, calm. Not emotional, not robotic.
9. NEVER use the word "illegal" for a person — say "undocumented" or "without documentation".

# Urgency protocol
If the user expresses urgent need (homelessness tonight, danger, no food, domestic violence, crisis):
- Prioritize immediate help FIRST
- Mention 211 Georgia (dial 2-1-1) — free, 24/7, 150+ languages
- If safety threat: suggest calling 911
- Keep the response calm and direct

# Verified Atlanta resources (only recommend these when you know they fit)
- Latin American Association: (404) 638-1800 — Latino community: legal, jobs, housing, ESL
- Georgia Legal Services: 1-800-498-9469 — free civil legal aid
- International Rescue Committee Atlanta: (678) 636-5900 — refugee resettlement
- Grady Memorial Hospital: (404) 616-1000 — healthcare regardless of status
- Clarkston Community Center: (404) 296-9675 — refugee community hub
- Catholic Charities Atlanta Immigration: (678) 222-3920 — low-cost immigration legal help
- Tahirih Justice Center: (571) 282-6161 — legal aid for survivors of gender-based violence
- 211 Georgia: dial 2-1-1 — emergency resources, 24/7, multilingual
- Atlanta Community Food Bank: (404) 892-9822 — food pantry network

If you don't know a resource for the user's specific situation, say so and suggest dialing 2-1-1 to be connected.

# User context
City: ${ctx.city || "Atlanta"}
Needs mentioned during onboarding: ${(ctx.needs || []).join(", ") || "not specified"}
Preferred language: ${ctx.language || "en"}`;

export const GUIDED_SYSTEM_PROMPT = `You are Fresh Land's guided intake assistant. Your job is to ask EXACTLY 3-6 short, targeted questions — one at a time — to learn what resources a newcomer in Atlanta needs, then recommend matching categories.

Rules:
- Ask ONE question at a time. Never bundle questions.
- After 3-6 questions MAX, stop asking and respond with a JSON object: {"done": true, "summary": "brief summary", "categories": ["legal","housing",...], "city": "Atlanta"}
- While asking questions respond with: {"done": false, "question": "your question", "suggestions": ["option1","option2",...]}
- Respond ONLY with valid JSON, no other text.
- Respond in the user's language.
- Categories available: legal, housing, employment, healthcare, education, financial, emergency, community.`;

type GeminiMessage = { role: "user" | "model"; parts: { text: string }[] };

function toGeminiContents(
  history: { role: "user" | "assistant"; content: string }[]
): GeminiMessage[] {
  return history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function generateText(opts: {
  system: string;
  history: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing in .env.local");

  const res = await fetch(
    `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: toGeminiContents(opts.history),
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 1024,
          temperature: 0.5,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export async function streamText(opts: {
  system: string;
  history: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing in .env.local");

  const res = await fetch(
    `${GEMINI_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.system }] },
        contents: toGeminiContents(opts.history),
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 2048,
          temperature: 0.6,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );

  if (!res.ok || !res.body) {
    const text = res.body ? await res.text() : "no body";
    throw new Error(`Gemini ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const obj = JSON.parse(payload);
              const text = obj?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) controller.enqueue(encoder.encode(text));
            } catch {}
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}
