// BlackRoad Agents API — REST API for 1,000 AI agents
// Powered by Cloudflare Workers + D1
// Proprietary BlackRoad OS, Inc. — All Rights Reserved

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-BR-API-KEY",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Type": "application/json",
};

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

function sanitizeInt(value, defaultVal, max) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 0) return defaultVal;
  return Math.min(parsed, max);
}

function sanitizeSearch(query) {
  if (!query || typeof query !== "string") return "";
  return query.slice(0, MAX_SEARCH_LENGTH).replace(/[^\w\s\-_.]/g, "");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...CORS_HEADERS, ...SECURITY_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } });
    }

    // Only allow GET requests
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405);
    }

    try {
      // Health check
      if (path === "/" || path === "/health") {
        const count = await env.DB.prepare("SELECT COUNT(*) as total FROM agents").first();
        return json({
          service: "BlackRoad Agents API",
          version: "1.0.0",
          status: "online",
          agents_count: count?.total || 0,
          endpoints: [
            "/agents",
            "/agents/:id",
            "/agents/type/:type",
            "/agents/random",
            "/agents/search?q=",
            "/agents/stats",
          ],
        });
      }

      // List all agents (paginated)
      if (path === "/agents") {
        const limit = sanitizeInt(url.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
        const offset = sanitizeInt(url.searchParams.get("offset"), 0, 10000);
        const results = await env.DB.prepare(
          "SELECT * FROM agents WHERE status = ? ORDER BY name LIMIT ? OFFSET ?"
        ).bind("active", limit, offset).all();
        return json({ agents: results.results, count: results.results.length, limit, offset });
      }

      // Get agent by ID
      const idMatch = path.match(/^\/agents\/(agent-\d{4})$/);
      if (idMatch) {
        const agent = await env.DB.prepare("SELECT * FROM agents WHERE id = ?").bind(idMatch[1]).first();
        if (!agent) return json({ error: "Agent not found" }, 404);
        return json(agent);
      }

      // Get agents by type
      const typeMatch = path.match(/^\/agents\/type\/(\w+)$/);
      if (typeMatch) {
        const results = await env.DB.prepare(
          "SELECT * FROM agents WHERE type = ? AND status = ? ORDER BY name"
        ).bind(typeMatch[1], "active").all();
        return json({ type: typeMatch[1], agents: results.results, count: results.results.length });
      }

      // Random agent
      if (path === "/agents/random") {
        const agent = await env.DB.prepare(
          "SELECT * FROM agents WHERE status = ? ORDER BY RANDOM() LIMIT 1"
        ).bind("active").first();
        return json(agent || { error: "No agents found" });
      }

      // Search agents
      if (path === "/agents/search") {
        const q = sanitizeSearch(url.searchParams.get("q"));
        if (!q) return json({ query: "", agents: [], count: 0 });
        const results = await env.DB.prepare(
          "SELECT * FROM agents WHERE (name LIKE ? OR type LIKE ? OR capabilities LIKE ?) AND status = ? LIMIT 20"
        ).bind(`%${q}%`, `%${q}%`, `%${q}%`, "active").all();
        return json({ query: q, agents: results.results, count: results.results.length });
      }

      // Stats
      if (path === "/agents/stats") {
        const total = await env.DB.prepare("SELECT COUNT(*) as c FROM agents").first();
        const byType = await env.DB.prepare(
          "SELECT type, COUNT(*) as count FROM agents GROUP BY type ORDER BY count DESC"
        ).all();
        return json({ total: total?.c, by_type: byType.results });
      }

      return json({ error: "Not found", path }, 404);
    } catch (_e) {
      return json({ error: "Internal server error" }, 500);
    }
  },
};
