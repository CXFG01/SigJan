import { afterEach, describe, expect, it, vi } from "vitest";
import { readAuthoritativeSource } from "@/lib/checker/evidence";
afterEach(() => vi.unstubAllGlobals());
describe("authoritative source reader", () => {
  it("rejects credentials, untrusted hosts and non-HTTPS before fetching", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    for (const url of ["https://nhs.uk.evil.example/a","http://www.nhs.uk/a","https://user@www.nhs.uk/a","https://www.nhs.uk:8443/a"]) await expect(readAuthoritativeSource(url)).rejects.toThrow("allowed");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not follow redirects outside the allowlist", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: "http://127.0.0.1/private" } })); vi.stubGlobal("fetch", fetcher);
    await expect(readAuthoritativeSource("https://www.nhs.uk/a")).rejects.toThrow("allowed"); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("records the URL and readable text, excluding script contents", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<main><script>secret-script</script><p>" + "Public evidence. ".repeat(20) + "</p></main>", { headers: { "content-type": "text/html" } })));
    const result = await readAuthoritativeSource("https://www.nhs.uk/a");
    expect(result.consulted_url).toBe("https://www.nhs.uk/a"); expect(result.text).not.toContain("secret-script"); expect(result.text).toContain("Public evidence");
  });
});
