import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeAuthDestination } from "@/lib/auth/redirect";
import { getSupabaseConfig } from "@/lib/supabase/config";

const emailOtpTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
]);

function authErrorResponse(request: NextRequest) {
  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("error", "invalid_link");
  return NextResponse.redirect(authUrl);
}

export async function GET(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) return authErrorResponse(request);

  const next = getSafeAuthDestination(
    request.nextUrl.searchParams.get("next"),
  );
  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? authErrorResponse(request) : response;
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (tokenHash && type && emailOtpTypes.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    return error ? authErrorResponse(request) : response;
  }

  return authErrorResponse(request);
}
