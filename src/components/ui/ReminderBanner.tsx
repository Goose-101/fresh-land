"use client";
import { useEffect, useRef } from "react";
import { Bell, X, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store";

// Singleton AudioContext primed by the first user gesture so reminder chimes
// can play later without hitting autoplay restrictions.
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new Ctx();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

function primeAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

function playChime() {
  const ctx = getCtx();
  if (!ctx) return;
  // If still suspended (no prior gesture), this no-ops gracefully.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  try {
    const now = ctx.currentTime + 0.02;
    // Three-tone rising chime — more attention-grabbing than two tones.
    const tones = [
      { freq: 784, start: 0, dur: 0.18 }, // G5
      { freq: 988, start: 0.13, dur: 0.18 }, // B5
      { freq: 1319, start: 0.26, dur: 0.32 }, // E6
    ];
    for (const tone of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = tone.freq;
      gain.gain.setValueAtTime(0, now + tone.start);
      gain.gain.linearRampToValueAtTime(0.32, now + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.dur + 0.05);
    }
  } catch {}
}

// Prime the AudioContext on the very first user interaction anywhere on the
// page. Once primed it persists for the session, so later auto-fired chimes
// from setTimeout (which are NOT a user gesture) can still play.
if (typeof window !== "undefined") {
  const onceOpts = { once: true, capture: true } as AddEventListenerOptions;
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  const prime = () => primeAudio();
  for (const ev of events) window.addEventListener(ev, prime, onceOpts);
}

export function ReminderBanner() {
  const banner = useAppStore((s) => s.reminderBanner);
  const clear = useAppStore((s) => s.clearReminderBanner);
  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!banner) return;
    if (lastIdRef.current === banner.id) return;
    lastIdRef.current = banner.id;
    playChime();
  }, [banner]);

  if (!banner) return null;

  const handleView = () => {
    banner.onView?.();
    clear();
  };

  const handleDismiss = () => {
    banner.onDismiss?.();
    clear();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[min(92vw,440px)] animate-slide-down"
    >
      <div className="flex items-start gap-3 bg-white shadow-modal border border-primary/30 rounded-card px-4 py-3">
        <div className="h-9 w-9 rounded-full bg-primary-light grid place-items-center shrink-0">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            {banner.title}
          </p>
          <p className="text-sm text-text mt-0.5 break-words">{banner.body}</p>
          {banner.onView && (
            <button
              onClick={handleView}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-slate-100 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
}