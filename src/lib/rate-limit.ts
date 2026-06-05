import { createAdminClient } from "./supabase/server";

type LimiterConfig = {
  prefix: string;
  requests: number;
  windowSeconds: number;
};

const aiChat: LimiterConfig = { prefix: "rl:ai:chat", requests: 20, windowSeconds: 3600 };
const aiGuided: LimiterConfig = { prefix: "rl:ai:guided", requests: 40, windowSeconds: 3600 };
const translate: LimiterConfig = { prefix: "rl:translate", requests: 60, windowSeconds: 3600 };
const places: LimiterConfig = { prefix: "rl:places", requests: 120, windowSeconds: 3600 };

export const aiChatLimiter = aiChat;
export const aiGuidedLimiter = aiGuided;
export const translateLimiter = translate;
export const placesLimiter = places;

export function getClientId(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}

export type RateLimitResult = {
  ok: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
};

export async function checkLimit(
  cfg: LimiterConfig | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!cfg) return { ok: true };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true };
  }

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_id: `${cfg.prefix}:${identifier}`,
      p_limit: cfg.requests,
      p_window_seconds: cfg.windowSeconds,
    });

    if (error || !data || !data[0]) {
      console.error("[rate-limit] RPC error", error?.message);
      return { ok: true };
    }

    const row = data[0] as { allowed: boolean; remaining: number; reset_at: string };
    return {
      ok: row.allowed,
      limit: cfg.requests,
      remaining: row.remaining,
      reset: Math.floor(new Date(row.reset_at).getTime() / 1000),
    };
  } catch (e: any) {
    console.error("[rate-limit] failed", e?.message);
    return { ok: true };
  }
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  if (r.limit === undefined) return {};
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining ?? 0),
    "X-RateLimit-Reset": String(r.reset ?? 0),
  };
}
