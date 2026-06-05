"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store";
import type { Resource } from "@/types";

type Step = {
  done: boolean;
  question?: string;
  suggestions?: string[];
  summary?: string;
  categories?: string[];
  city?: string;
};

type Msg = { role: "user" | "ai"; text: string };

export function GuidedFlow() {
  const { currentLanguage } = useAppStore();
  const [history, setHistory] = useState<Msg[]>([]);
  const [current, setCurrent] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [recommendations, setRecommendations] = useState<Resource[] | null>(null);
  const [summary, setSummary] = useState<string>("");
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ask([]);
    }
  }, []);

  const ask = async (h: Msg[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "guided",
          history: h.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })),
          language: currentLanguage,
        }),
      });
      const data = await res.json();
      const step: Step = data.step;

      if (step?.done) {
        setSummary(step.summary || "");
        const r = await fetch(`/api/resources?categories=${(step.categories || []).join(",")}&city=${step.city || ""}`);
        const rd = await r.json();
        setRecommendations(rd.resources || []);
      } else {
        setCurrent(step);
      }
    } catch {
      setCurrent({ done: false, question: "Sorry, something went wrong. What do you need help with?" });
    } finally {
      setLoading(false);
    }
  };

  const submit = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    const next = [...history, { role: "user", text: value } as Msg];
    setHistory(next);
    setAnswer("");
    setCurrent(null);
    await ask(next);
  };

  if (recommendations) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 bg-primary-light border border-primary/20 rounded-card p-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-dark">
              Based on what you told me, here are the best resources for you:
            </p>
            {summary && <p className="text-xs text-text-secondary mt-1">{summary}</p>}
          </div>
        </div>
        {recommendations.length === 0 && (
          <p className="text-sm text-text-secondary">Try browsing all resources.</p>
        )}
        {recommendations.map((r) => (
          <Link
            key={r.id}
            href={`/resources/${r.id}`}
            className="block bg-white rounded-card border border-border p-4 hover:border-primary/40 transition"
          >
            <p className="text-sm font-semibold">{r.name}</p>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
              {r.short_description || r.description}
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2">
              Open resource <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
        <Link href="/pathway">
          <Button variant="primary" fullWidth>Start your guided pathway</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.length === 0 && !loading && (
        <p className="text-sm text-text-secondary">
          Hi! I'm going to ask you a few quick questions to find the right resources for you. It'll only take a minute.
        </p>
      )}

      {history.map((m, i) => (
        <div
          key={i}
          className={m.role === "user" ? "text-right" : ""}
        >
          <span
            className={
              m.role === "user"
                ? "inline-block bg-primary text-white rounded-2xl px-3.5 py-2 text-sm max-w-[85%]"
                : "inline-block bg-slate-50 rounded-2xl px-3.5 py-2 text-sm max-w-[85%]"
            }
          >
            {m.text}
          </span>
        </div>
      ))}

      {loading && (
        <div className="inline-flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> thinking…
        </div>
      )}

      {current?.question && !loading && (
        <div className="bg-slate-50 rounded-card p-4">
          <p className="text-sm font-medium text-text">{current.question}</p>
          {current.suggestions && current.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {current.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-pill border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-primary-light hover:border-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(answer); }}
            className="mt-3 flex gap-2"
          >
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Or type your answer..."
              className="flex-1 px-3 py-2 rounded-btn border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button type="submit" variant="primary" size="sm">Send</Button>
          </form>
        </div>
      )}
    </div>
  );
}
