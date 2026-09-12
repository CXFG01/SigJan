// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ state: { job: {} as Record<string, unknown>, run: {} as Record<string, unknown> }, start: vi.fn(), remove: vi.fn(), report: vi.fn(), retrieve: vi.fn(), turns: vi.fn(), items: vi.fn() }));
vi.mock("@/lib/checker/store", () => ({ database: () => ({ from: (table: string) => {
  const filters: [string, unknown][] = [];
  let patch: Record<string, unknown> | undefined;
  const execute = () => {
    const row = table === "checker_runs" ? mocks.state.run : mocks.state.job;
    if (patch && filters.every(([key,value]) => row[key] === value)) Object.assign(row, patch);
    return { data: row, error: null };
  };
  const query = { select: () => query, update: (value: Record<string, unknown>) => { patch = value; return query; }, eq: (key: string, value: unknown) => { filters.push([key,value]); return query; }, single: async () => execute(), then: (resolve: (result: unknown) => unknown) => Promise.resolve(execute()).then(resolve) };
  return query;
} }) }));
vi.mock("@/lib/checker/agents", () => ({ startSession: mocks.start, deleteSession: mocks.remove, reportFromItems: mocks.report, agentsClient: () => ({ beta: { agents: { sessions: { retrieve: mocks.retrieve, turns: { list: mocks.turns }, items: { list: mocks.items } } } } }) }));
import { perform, type Job } from "@/lib/checker/worker";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("OPENAI_API_KEY", "test");
  mocks.state.job = { id: "j", run_hash: "h", pair_id: "0-1", status: "running", session_id: null, started_at: new Date().toISOString() };
  mocks.state.run = { token_hash: "h", cancelled: false, expires_at: new Date(Date.now()+3600000).toISOString(), result: { pairs: [{ id: "0-1", findings: [{ id: "unchanged" }] }], coverage: [] } };
  mocks.start.mockResolvedValue({ id: "provider" }); mocks.remove.mockResolvedValue(undefined);
  mocks.retrieve.mockResolvedValue({ status: "idle", required_actions: [], usage: null });
  mocks.turns.mockResolvedValue({ data: [{ status: "completed" }] });
  mocks.items.mockImplementation(async function* () { yield { type: "message" }; });
  mocks.report.mockReturnValue({ reports: [{ evidenceState: "established" }] });
});
describe("managed investigation lifecycle", () => {
  it("stores a validated result and deletes its provider session", async () => {
    const original = JSON.stringify(mocks.state.run.result);
    await perform({ ...mocks.state.job } as Job);
    expect(mocks.state.job.status).toBe("completed"); expect(mocks.remove).toHaveBeenCalledWith("provider");
    expect(mocks.state.job.session_id).toBeNull(); expect(JSON.stringify(mocks.state.run.result)).toBe(original);
  });
  it("withholds unsupported output without changing database findings", async () => {
    mocks.report.mockImplementation(() => { throw Error("bad citation"); });
    await perform({ ...mocks.state.job } as Job);
    expect(mocks.state.job.status).toBe("insufficient"); expect(mocks.state.job.report).toBeUndefined(); expect(mocks.remove).toHaveBeenCalled();
  });
  it("does not start cancelled work", async () => {
    mocks.state.run.cancelled = true; await perform({ ...mocks.state.job } as Job);
    expect(mocks.start).not.toHaveBeenCalled(); expect(mocks.state.job.status).toBe("cancelled");
  });
  it("does not overwrite cancellation that races session creation", async () => {
    mocks.start.mockImplementation(async () => { mocks.state.job.status = "cancelled"; return { id: "provider" }; });
    await perform({ ...mocks.state.job } as Job);
    expect(mocks.state.job.status).toBe("cancelled"); expect(mocks.remove).toHaveBeenCalledWith("provider");
  });
  it("retains provider IDs for cleanup retry if deletion fails", async () => {
    mocks.remove.mockRejectedValue(Error("temporary failure"));
    await perform({ ...mocks.state.job } as Job);
    expect(mocks.state.job.session_id).toBe("provider");
  });
  it("enforces the application deadline", async () => {
    mocks.state.job.started_at = new Date(Date.now()-100000).toISOString();
    await perform({ ...mocks.state.job } as Job);
    expect(mocks.state.job.status).toBe("timed_out"); expect(mocks.remove).toHaveBeenCalled();
  });
  it("reports unavailable API configuration without substitution", async () => {
    vi.stubEnv("OPENAI_API_KEY", ""); await perform({ ...mocks.state.job } as Job);
    expect(mocks.state.job.status).toBe("unavailable"); expect(mocks.start).not.toHaveBeenCalled();
  });
});
