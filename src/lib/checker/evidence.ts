import { isAllowedSourceUrl } from "@/lib/interactions/policy";
export async function readAuthoritativeSource(value: unknown) {
  if (typeof value !== "string") throw new Error("A source URL is required.");
  let url = new URL(value);
  const signal = AbortSignal.timeout(10_000);
  for (let hop = 0; hop < 4; hop++) {
    if (url.protocol !== "https:" || url.username || url.password || url.port || !isAllowedSourceUrl(url.href)) throw new Error("Source URL is not allowed.");
    const response = await fetch(url, { signal, redirect: "manual", headers: { Accept: "text/html,text/plain", "User-Agent": "SignalRx-Evidence-Prototype/1.0" } });
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("Source redirect failed.");
      url = new URL(location, url); continue;
    }
    if (!response.ok || !/text\/(html|plain)/i.test(response.headers.get("content-type") ?? "")) { await response.body?.cancel(); throw new Error("Source could not be read as text."); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Source body unavailable.");
    let html = "", size = 0;
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value: bytes } = await reader.read(); if (done) break;
      size += bytes.length;
      if (size > 1_000_000) { await reader.cancel(); break; }
      html += decoder.decode(bytes, { stream: true });
    }
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
    const text = main.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    if (text.length < 100) throw new Error("Source did not contain readable evidence.");
    return { consulted_url: url.href, requested_url: value, text: text.slice(0, 25000), truncated: size > 1_000_000 || text.length > 25000 };
  }
  throw new Error("Too many source redirects.");
}
