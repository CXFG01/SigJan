import { z } from "zod";
import { body, reply, RequestError } from "@/lib/checker/http";
import { database, clientKey, limit } from "@/lib/checker/store";
import { extractMedicines } from "@/lib/checker/extraction";
import { resolveMedicine } from "@/lib/checker/identity";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const input = z.object({ text: z.string().trim().min(1).max(8000) }).strict().safeParse(await body(request));
    if (!input.success) return reply({ error: "Enter up to 8,000 characters of prescription text." }, 400);
    if (!await limit(`extract:${clientKey(request)}`)) return reply({ error: "Please wait ten minutes before another extraction." }, 429);
    const medicines = await extractMedicines(input.data.text);
    const candidates = await Promise.all(medicines.map(async ({ original, ...m }) => {
      const resolved = await resolveMedicine(database(), m);
      return { ...m, original, ingredients: resolved?.ingredients ?? [], identitySource: resolved?.identitySource ?? "", issue: resolved ? null : "Medicine identity needs clarification. Enter the exact ingredient name." };
    }));
    return reply({ candidates });
  } catch (error) { return error instanceof RequestError ? reply({ error: error.message }, error.status) : reply({ error: "We could not read the prescription right now. Please try again or enter the medicines individually." }, 503); }
}
