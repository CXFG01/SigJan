import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createClient } from "@supabase/supabase-js";

const paths = process.argv.slice(2);
if (!paths.length) {
  throw new Error(
    "Usage: pnpm import:ddinter <DDInter CSV> [additional category CSVs...]",
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.",
  );
}

const client = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const version = process.env.DDINTER_VERSION ?? "2.0";

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function severity(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "major") return "Major";
  if (normalized === "moderate") return "Moderate";
  if (normalized === "minor") return "Minor";
  return "Unknown";
}

const { data: release, error: releaseError } = await client
  .from("interaction_source_releases")
  .upsert(
    {
      source_key: "ddinter",
      version,
      source_url: "https://ddinter2.scbdd.com/download/",
      licence: "CC BY-NC-SA 4.0",
      active: true,
    },
    { onConflict: "source_key,version" },
  )
  .select("id")
  .single();
if (releaseError) throw releaseError;

let imported = 0;
for (const path of paths) {
  const text = await readFile(path, "utf8");
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines.shift() ?? "");
  const required = ["DDInterID_A", "Drug_A", "DDInterID_B", "Drug_B", "Level"];
  const indexes = Object.fromEntries(
    required.map((column) => [column, header.indexOf(column)]),
  );
  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error(`${basename(path)} does not match the DDInter 2.0 CSV shape.`);
  }

  const rows = lines.map((line) => {
    const values = parseCsvLine(line);
    const left = {
      id: values[indexes.DDInterID_A],
      name: values[indexes.Drug_A],
      normalized: normalize(values[indexes.Drug_A]),
    };
    const right = {
      id: values[indexes.DDInterID_B],
      name: values[indexes.Drug_B],
      normalized: normalize(values[indexes.Drug_B]),
    };
    const [factorA, factorB] =
      left.normalized < right.normalized ? [left, right] : [right, left];
    return {
      source_release_id: release.id,
      external_record_id: `${left.id}-${right.id}`,
      factor_a: factorA.name,
      factor_a_normalized: factorA.normalized,
      factor_b: factorB.name,
      factor_b_normalized: factorB.normalized,
      severity: severity(values[indexes.Level]),
    };
  });

  for (let offset = 0; offset < rows.length; offset += 1000) {
    const { error } = await client.from("ddi_interactions").upsert(
      rows.slice(offset, offset + 1000),
      {
        onConflict:
          "source_release_id,external_record_id,factor_a_normalized,factor_b_normalized",
      },
    );
    if (error) throw error;
  }
  imported += rows.length;
  console.log(`Imported ${rows.length} records from ${basename(path)}.`);
}

const { error: countError } = await client
  .from("interaction_source_releases")
  .update({ record_count: imported, imported_at: new Date().toISOString() })
  .eq("id", release.id);
if (countError) throw countError;
console.log(`DDInter ${version}: ${imported} records imported.`);

