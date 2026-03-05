import { describe, it, expect, beforeAll } from "vitest";
import { env, SELF } from "cloudflare:test";

const SEED_SQL = `
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    capabilities TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  INSERT OR IGNORE INTO agents (id, name, type, status, capabilities)
  VALUES
    ('agent-0001', 'Alpha', 'assistant', 'active', 'search,summarize'),
    ('agent-0002', 'Beta', 'researcher', 'active', 'analyze,report'),
    ('agent-0003', 'Gamma', 'assistant', 'inactive', 'translate');
`;

beforeAll(async () => {
  for (const stmt of SEED_SQL.split(";").filter((s) => s.trim())) {
    await env.DB.prepare(stmt).run();
  }
});

describe("BlackRoad Agents API", () => {
  it("GET / returns health check with service info", async () => {
    const res = await SELF.fetch("https://api.test/");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe("BlackRoad Agents API");
    expect(body.version).toBe("1.0.0");
    expect(body.status).toBe("online");
    expect(body.endpoints).toBeInstanceOf(Array);
  });

  it("GET /health returns same health check", async () => {
    const res = await SELF.fetch("https://api.test/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("online");
  });

  it("GET /agents returns paginated active agents", async () => {
    const res = await SELF.fetch("https://api.test/agents");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agents).toBeInstanceOf(Array);
    expect(body.agents.length).toBe(2); // only active agents
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
  });

  it("GET /agents?limit=1 respects pagination", async () => {
    const res = await SELF.fetch("https://api.test/agents?limit=1");
    const body = await res.json();
    expect(body.agents.length).toBe(1);
    expect(body.limit).toBe(1);
  });

  it("GET /agents/agent-0001 returns specific agent", async () => {
    const res = await SELF.fetch("https://api.test/agents/agent-0001");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("agent-0001");
    expect(body.name).toBe("Alpha");
  });

  it("GET /agents/agent-9999 returns 404 for missing agent", async () => {
    const res = await SELF.fetch("https://api.test/agents/agent-9999");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Agent not found");
  });

  it("GET /agents/type/assistant returns agents by type", async () => {
    const res = await SELF.fetch("https://api.test/agents/type/assistant");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("assistant");
    expect(body.agents.length).toBe(1); // only active assistant
  });

  it("GET /agents/random returns a random agent", async () => {
    const res = await SELF.fetch("https://api.test/agents/random");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe("active");
  });

  it("GET /agents/search?q=Alpha finds matching agents", async () => {
    const res = await SELF.fetch("https://api.test/agents/search?q=Alpha");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.query).toBe("Alpha");
    expect(body.agents.length).toBe(1);
    expect(body.agents[0].name).toBe("Alpha");
  });

  it("GET /agents/stats returns statistics", async () => {
    const res = await SELF.fetch("https://api.test/agents/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.by_type).toBeInstanceOf(Array);
  });

  it("GET /nonexistent returns 404", async () => {
    const res = await SELF.fetch("https://api.test/nonexistent");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Not found");
  });

  it("OPTIONS returns CORS headers", async () => {
    const res = await SELF.fetch("https://api.test/", { method: "OPTIONS" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("responses include security headers", async () => {
    const res = await SELF.fetch("https://api.test/");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });
});
