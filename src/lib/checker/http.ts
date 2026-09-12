import { NextResponse } from "next/server";
export function reply(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }); }
export class RequestError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function body(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new RequestError("Invalid request origin.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new RequestError("Send JSON.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Empty request.");
  let size = 0, text = "";
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16_384) { await reader.cancel(); throw new RequestError("Request too large.", 413); }
    text += decoder.decode(value, { stream: true });
  }
  try { return JSON.parse(text + decoder.decode()); } catch { throw new RequestError("Invalid JSON."); }
}
