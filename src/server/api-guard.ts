import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/supabase/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 12;
const MAX_BODY_BYTES = 32_000;
const requestWindows = new Map<
  string,
  { count: number; windowStartedAt: number }
>();

function requestKey(request: Request, userId: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  return `${userId}:${address}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.windowStartedAt >= WINDOW_MS) {
    requestWindows.set(key, { count: 1, windowStartedAt: now });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export async function guardSignalRxRequest(
  request: Request,
): Promise<NextResponse | null> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_BODY_BYTES
  ) {
    return NextResponse.json(
      { error: "The request is too large." },
      { status: 413 },
    );
  }

  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json(
      { error: "A valid SignalRx session is required." },
      { status: 401 },
    );
  }

  if (isRateLimited(requestKey(request, identity.userId))) {
    return NextResponse.json(
      { error: "Too many extraction requests. Please wait a minute." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  return null;
}

