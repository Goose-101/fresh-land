"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mic, Send, X, MessageSquare, Sparkles } from "lucide-react";
import { useAppStore } from "@/store";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { VoiceInput } from "./VoiceInput";
import { GuidedFlow } from "./GuidedFlow";
import { cn } from "@/lib/utils";
import { useT } from "@/components/I18nProvider";

export function AIAssistant() {
  const pathname = usePathname();
  const { aiOpen, setAIOpen, aiMessages, addAIMessage, user, currentLanguage } = useAppStore();
  const { t } = useT();
  const [tab, setTab] = useState<"chat" | "guide">("chat");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>(`s_${Date.now()}`);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [aiMessages, partial]);

  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/onboarding")) {
    return null;
  }

  const QUICK = [t("ai.quick1"), t("ai.quick2"), t("ai.quick3"), t("ai.quick4")];

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || streaming) return;
    addAIMessage({ role: "user", content: msg, timestamp: Date.now() });
    setInput("");
    setStreaming(true);
    setPartial("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: "chat",
          message: msg,
          language: currentLanguage,
          sessionId: sessionRef.current,
          userContext: user
            ? { city: user.city, needs: user.needs }
            : {},
          conversationHistory: aiMessages.slice(-10),
        }),
      });

      if (res.status === 429) {
        addAIMessage({ role: "assistant", content: t("ai.rateLimited") });
        return;
      }
      if (!res.ok || !res.body) {
        addAIMessage({ role: "assistant", content: t("ai.trouble") });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPartial(acc);
      }
      addAIMessage({ role: "assistant", content: acc || t("ai.trouble"), timestamp: Date.now() });
    } catch (e: any) {
      addAIMessage({
        role: "assistant",
        content: e?.name === "AbortError" ? t("ai.timeout") : t("ai.trouble"),
      });
    } finally {
      clearTimeout(timeoutId);
      setStreaming(false);
      setPartial("");
    }
  };

  return (
    <>
      {!aiOpen && (
        <button
          onClick={() => setAIOpen(true)}
          className="fixed right-6 bottom-24 md:bottom-6 z-40 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-pill shadow-modal pl-3 pr-4 py-2.5"
        >
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <Mic className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse-dot" />
          </span>
          <span className="font-medium text-sm">{t("ai.askFresh")}</span>
        </button>
      )}

      {aiOpen && (
        <div
          className={cn(
            "fixed z-50 bg-white shadow-modal flex flex-col",
            "inset-0 md:inset-auto md:right-6 md:bottom-6 md:top-20 md:w-[380px] md:rounded-card md:border md:border-border"
          )}
        >
          <div className="bg-primary text-white px-4 py-3 flex items-center gap-2 md:rounded-t-card">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">{t("ai.title")}</span>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSelector compact />
              <button
                onClick={() => setAIOpen(false)}
                className="p-1.5 rounded-btn hover:bg-white/20"
                aria-label={t("action.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-border">
            {(["chat", "guide"] as const).map((tk) => (
              <button
                key={tk}
                onClick={() => setTab(tk)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium border-b-2 transition",
                  tab === tk ? "border-primary text-primary" : "border-transparent text-text-secondary"
                )}
              >
                {tk === "chat" ? (
                  <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> {t("ai.chat")}</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> {t("ai.guideMe")}</span>
                )}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {tab === "chat" ? (
              <>
                {aiMessages.length === 0 && !streaming && (
                  <div className="text-sm text-text-secondary bg-primary-light rounded-card p-4">
                    {t("ai.welcome")}
                  </div>
                )}
                {aiMessages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-primary text-white"
                          : "bg-slate-50 border border-border text-text"
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {streaming && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-slate-50 border border-border rounded-2xl px-3.5 py-2 text-sm">
                      {partial || (
                        <span className="inline-flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:120ms]" />
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot [animation-delay:240ms]" />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <GuidedFlow />
            )}
          </div>

          {tab === "chat" && (
            <div className="border-t border-border p-3">
              {aiMessages.length === 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-2 pb-1">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="shrink-0 text-xs rounded-pill border border-border px-3 py-1.5 hover:bg-primary-light"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex items-center gap-2"
              >
                <VoiceInput
                  language={currentLanguage}
                  onTranscript={setInput}
                  onAutoSubmit={(t) => send(t)}
                />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("ai.placeholder")}
                  className="flex-1 px-3 py-2 rounded-btn border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className="p-2 rounded-full bg-primary text-white disabled:opacity-50"
                  aria-label={t("action.send")}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
