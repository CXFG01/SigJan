import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      integrations: {
        openai: Boolean(process.env.OPENAI_API_KEY),
        supabase: Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
            (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        ),
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}

