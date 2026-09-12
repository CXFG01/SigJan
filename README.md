# SignalRx

**Paste a prescription. Confirm the medicines. Check documented interactions. Investigate uncertain evidence.**

SignalRx is an anonymous, UK-focused hackathon prototype for **synthetic prescriptions**. It shows database findings immediately and uses the **OpenAI Agents API** to investigate selected gaps. There are no accounts, personal histories, calendars, uploads or lifestyle graphs in the active application.

## The flow

1. Paste up to 8,000 characters, or enter medicines individually.
2. Review medicine names, original wording, dose, route and frequency. Missing details stay blank. Exact ingredient identities are checked again on submission; unresolved names require correction.
3. Check every pair in a list of two to ten medicines against active DDInter releases. Combination products are expanded to their constituent ingredients. Conflicting source records remain visible.
4. Automatically investigate up to three uncertain pairs, prioritising conflicting evidence, incomplete findings, then uncovered pairs.
5. Show research separately from immutable database findings. Unsupported, unavailable, cancelled and timed-out investigations remain explicitly unresolved.

No database match is a coverage statement, not a declaration of safety. Reports do not prescribe changes to treatment.

## Architecture

- Next.js / React / TypeScript website and server endpoints.
- Supabase holds versioned interaction knowledge and private, temporary run/queue tables. A service key is used only on the server.
- OpenAI Responses performs structured extraction with application validation and `store: false`.
- OpenAI **Agents API**, through `openai` 7.15, creates one hosted session per selected pair. The previous `@openai/agents` SDK runner has been removed.
- Sessions have subagents disabled, authoritative-domain web search, a read-only pair-evidence tool, and an HTTPS source-reader tool. Hosted sandbox network access is disabled; source retrieval takes place through the explicit tools.
- Publication requires a valid report for the assigned pair, traced authoritative source URLs, at least two source domains for research leads, and the retained treatment-language checks. These checks do not establish clinical correctness.

Implementation entrypoints: `src/lib/checker`, `src/app/api/checker`, and `src/components/prescription-checker.tsx`.

### Limits and lifecycle

The default deployment allowance is 30 sessions per UTC day; `CHECKER_DAILY_SESSIONS` can lower it, including to zero. Database reservations enforce a global maximum of two active jobs. Sessions pending deletion retain their slot. There are five checks and five extractions per client per ten minutes. On Vercel, the client bucket uses the platform-overwritten IP header, hashed with a server secret; other hosts intentionally share a bucket until a trusted proxy is configured.

Each pair has a 90-second application deadline. Provider usage above 25,000 reported tokens also stops the job, but usage reporting is best effort, not a hard provider token cap. The installed Agents API creation schema does not expose an application-set token budget. Daily reservations and cancellation supply the primary bounds.

`next/server`'s `after()` runs the durable queue independently of the response stream. A **once-per-minute maintenance trigger is required** for recovery and expiry when the browser closes. `vercel.json` declares it; use a Vercel plan that supports that frequency, or call the protected endpoint from another scheduler. Local development also needs that trigger for unattended cleanup.

Cancellation is persisted before provider cancellation. Deletion retries temporary 409 responses while cancellation becomes durable. Failed cleanup retains the provider ID for maintenance retry. Metadata reconciliation recovers sessions created immediately before a worker lost its connection.

### Temporary data

Original prescription text is never written to application tables. The UI clears pasted text after extraction and keeps its run token only in memory. Temporary medicine context/results become inaccessible after one hour and are scrubbed on the next maintenance pass. Provider IDs may remain for cleanup retry. Nothing is placed in local/session storage or URL query parameters.

Provider deletion is requested on completion, cancellation or expiry. Physical cleanup can be asynchronous; OpenAI's retention policies remain separate. This is **not zero retention**. Raw patient text and provider errors are not logged by application handlers.

## Run locally

Use Node.js 22+ and pnpm. Copy `.env.example` to `.env.local` and supply the Supabase server URL/key and OpenAI project key. Existing `NEXT_PUBLIC_SUPABASE_URL` and legacy service-role keys remain accepted, but the checker does not require a public browser key or JWKS URL.

```powershell
pnpm install
pnpm dev
```

If your shell already defines a key, Next.js gives that inherited variable precedence over `.env.local`; remove the stale shell value or restart with the correct environment.

### Database preparation

The additive migration `supabase/migrations/20260912162223_anonymous_checker.sql` creates the server-only run, job and counter tables and atomic functions. **It must be applied before connected checking can work.** Existing patient records and historical migrations are preserved. This implementation does not apply migrations to the hosted project or deploy the website.

For a future deployment, review and apply the migration using your normal Supabase migration workflow. Set `CRON_SECRET` for the scheduler's `Authorization: Bearer ...` header. Verify cleanup and quotas before enabling the demo. Retired remotely deployed intake/reminder workers should also be disabled during that rollout; removing repository routes does not undeploy a remote function.

The configured project was read-only verified on 2026-09-12: DDInter 2.0 has 160,235 records and the existing attributed seed release has one. Source checks query actual active-release counts and paginate findings. No CSV is bundled. To import an authorised snapshot, set `DDINTER_VERSION` and run:

```powershell
node --env-file=.env.local scripts/import-ddinter.mjs C:\path\to\ddinter.csv
```

Additional sources implement `SourceAdapter.check(ingredients)`, returning findings, provenance, coverage and errors. There is no arbitrary CSV upload or automatic trust in an unknown API.

## Endpoint contract

| Endpoint | Input / output |
| --- | --- |
| `POST /api/checker/extract` | `{text}` → editable candidates with original wording and identity status |
| `POST /api/checker/check` | `{medicines, idempotencyKey}` → `{token, run}`; each medicine has `name`, `dose`, `route`, `frequency` |
| `GET /api/checker/run` | `Authorization: Bearer <token>` → latest public run; provider IDs never returned |
| `DELETE /api/checker/run` | Same bearer token → cancels pending research while preserving completed findings |
| `GET /api/checker/maintenance` | Cron secret bearer token → reconciliation, expiry cleanup and queue processing |

Retry a check with the same UUID and same medicine list. A conflicting payload receives 409. Invalid identities receive 422; throttled requests receive 429. Missing provider/storage configuration is explicit, with no old SDK or fictional data fallback.

## Verification

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Tests cover real PostgreSQL semantics locally through PGlite, pair selection, immutable findings, cancellation races, quotas, token boundaries and citation policy. Browser tests use explicitly mocked service responses to verify the interface on desktop/mobile; they do not claim a deployed end-to-end clinical test. Historical database/security contracts remain tested.

Optional live checks use **synthetic data only**, load `.env.local` explicitly, consume API usage and write ignored `.qa` artifacts:

```powershell
node --import tsx scripts/verify-checker.ts
node --import tsx scripts/verify-agents.ts
```

The successful live investigation on 2026-09-12 passed source/publication validation with two authoritative sources in about 70 seconds; provider deletion succeeded. This demonstrates execution, not clinical accuracy. See `DEMO_SCRIPT.md` for the revised demonstration.

Official references: [Agents API](https://developers.openai.com/api/docs/guides/agents-api/overview), [session lifecycle](https://developers.openai.com/api/docs/guides/agents-api/sessions/manage), [function tools](https://developers.openai.com/api/docs/guides/agents-api/tools/functions).
