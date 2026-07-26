import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/server";

const endpointByType: Record<string, string | null> = {
  prescribed_medication: "medicines",
  otc_medication: "medicines",
  condition: "conditions",
  symptom: "symptoms",
  laboratory_marker: "tests-and-treatments",
};

export async function GET(_: Request, { params }: { params: Promise<{ type: string; code: string }> }) {
  const auth = await authenticateRequest();
  if (!auth) return jsonError("Sign in to view information.", 401);
  const { type, code } = await params;
  const endpoint = endpointByType[type];
  if (!endpoint) {
    return NextResponse.json({
      coverage: "unsupported",
      title: decodeURIComponent(code),
      message: "SignalRx does not have an authoritative UK source for this item.",
      externalLinks: [
        { organisation: "NHS", url: "https://www.nhs.uk/" },
        { organisation: "MHRA", url: "https://products.mhra.gov.uk/" },
      ],
    });
  }
  const slug = decodeURIComponent(code).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const admin = getSupabaseAdminClient();
  if (!admin) return jsonError("Authoritative content is not configured.", 503);
  const { data: cached } = await admin
    .from("content_snapshots")
    .select("*")
    .eq("content_type", endpoint)
    .eq("code", slug)
    .gt("expires_at", new Date().toISOString())
    .order("retrieved_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cached) return NextResponse.json(cached);
  const apiKey = process.env.NHS_CONTENT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      coverage: "credentials_pending",
      title: decodeURIComponent(code),
      message: "Authoritative NHS content is not available in this environment yet.",
      organisation: "NHS website",
      sourceUrl: `https://www.nhs.uk/${endpoint}/${slug}/`,
    });
  }
  const base = process.env.NHS_CONTENT_API_BASE_URL ?? "https://api.service.nhs.uk/nhs-website-content";
  const source = `${base}/${endpoint}/${slug}/?modules=true`;
  const response = await fetch(source, { headers: { apikey: apiKey, accept: "application/json" } });
  if (!response.ok) {
    return NextResponse.json({
      coverage: "not_found",
      message: "No matching NHS page was found. SignalRx has not generated a substitute.",
      sourceUrl: `https://www.nhs.uk/${endpoint}/`,
    }, { status: 404 });
  }
  const content = await response.json();
  const retrievedAt = new Date();
  const expiresAt = new Date(retrievedAt);
  expiresAt.setDate(expiresAt.getDate() + 7);
  const snapshot = {
    content_type: endpoint,
    code: slug,
    organisation: content.author?.name ?? "NHS website",
    source_url: content.url ?? `https://www.nhs.uk/${endpoint}/${slug}/`,
    source_updated_at: content.dateModified ?? null,
    retrieved_at: retrievedAt.toISOString(),
    version: content.dateModified ?? retrievedAt.toISOString().slice(0, 10),
    title: content.name ?? decodeURIComponent(code),
    content,
    expires_at: expiresAt.toISOString(),
  };
  await admin.from("content_snapshots").upsert(snapshot, { onConflict: "content_type,code,version" });
  return NextResponse.json(snapshot);
}
