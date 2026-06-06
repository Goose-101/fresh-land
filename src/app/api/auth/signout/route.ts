import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

async function handle(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            const { maxAge: _ma, expires: _ex, ...rest } = options;
            response.cookies.set(name, value, rest);
          });
        },
      },
    }
  );

  await supabase.auth.signOut();

  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
