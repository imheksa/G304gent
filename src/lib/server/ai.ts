import Anthropic from "@anthropic-ai/sdk";
import type { BrandCore, EngineName } from "@/lib/brand-data";

// The AI engine is optional: when ANTHROPIC_API_KEY isn't set, the app falls
// back to the deterministic generator so nothing breaks.
const apiKey = process.env.ANTHROPIC_API_KEY || "";
export const aiEnabled = apiKey.length > 0;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

const ENGINES: EngineName[] = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];

// JSON schema the model must fill — drives a structured, parseable response.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brandScore", "soa", "accuracy", "citation", "engines", "alerts", "topQueries", "canonicalFacts"],
  properties: {
    brandScore: { type: "integer", description: "Overall AI-visibility score 0-100" },
    soa: { type: "integer", description: "Share of Answer percentage 0-100" },
    accuracy: { type: "integer", description: "Accuracy of AI claims about the brand 0-100" },
    citation: { type: "integer", description: "How often AI cites the brand as a source 0-100" },
    engines: {
      type: "array",
      description: "One entry per AI engine, in this exact order: ChatGPT, Gemini, Claude, Grok, Deepseek, Google AI",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "status", "accuracy", "soa"],
        properties: {
          name: { type: "string", enum: ENGINES },
          status: { type: "string", enum: ["mentioned", "not_found"] },
          accuracy: { type: "integer" },
          soa: { type: "integer" },
        },
      },
    },
    alerts: {
      type: "array",
      description: "3-5 concrete misinformation or visibility issues",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "engine", "query", "issue"],
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          engine: { type: "string" },
          query: { type: "string" },
          issue: { type: "string" },
        },
      },
    },
    topQueries: {
      type: "array",
      description: "3 representative user queries about the brand",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["query", "mentions", "accuracy", "trend"],
        properties: {
          query: { type: "string" },
          mentions: { type: "integer" },
          accuracy: { type: "integer" },
          trend: { type: "string", enum: ["up", "down", "stable"] },
        },
      },
    },
    canonicalFacts: {
      type: "array",
      description: "4-6 key facts about the brand and whether AI represents them correctly",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["fact", "status", "violations"],
        properties: {
          fact: { type: "string" },
          status: { type: "string", enum: ["accurate", "violated", "missing"] },
          violations: { type: "integer" },
        },
      },
    },
  },
} as const;

const SYSTEM = `You are 6304 Agent, a Generative Engine Optimization (GEO) analyst for Web3.
Assess how major AI engines (ChatGPT, Gemini, Claude, Grok, Deepseek, Google AI) currently represent a given Web3 project, based on your knowledge of it.
Judge: is the project mentioned, are facts (fees, audits, custody, tokenomics, launch year, TVL) accurate, and how prominent is it in AI answers.
Be realistic and specific to the actual project. If you don't recognize the project, reflect that with low visibility, low accuracy, and "not_found" on most engines. Return only the structured fields.`;

function clamp(n: unknown, lo = 0, hi = 100): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(lo, Math.min(hi, v));
}

// Coerce the model output into a safe, complete BrandCore (exactly six engines,
// clamped numbers, non-empty arrays) so the dashboard never breaks on a stray
// response.
function normalize(raw: BrandCore, brand: string): BrandCore {
  const byName = new Map((raw.engines ?? []).map((e) => [e.name, e]));
  const engines = ENGINES.map((name) => {
    const e = byName.get(name);
    const status = e?.status === "not_found" ? "not_found" : "mentioned";
    return {
      name,
      status: status as "mentioned" | "not_found",
      accuracy: status === "not_found" ? 0 : clamp(e?.accuracy),
      soa: status === "not_found" ? 0 : clamp(e?.soa),
    };
  });
  const alerts = (raw.alerts ?? []).slice(0, 5).map((a) => ({
    severity: (["high", "medium", "low"].includes(a.severity) ? a.severity : "medium") as "high" | "medium" | "low",
    engine: String(a.engine || "ChatGPT"),
    query: String(a.query || brand),
    issue: String(a.issue || `Inaccurate information about ${brand}`),
  }));
  const topQueries = (raw.topQueries ?? []).slice(0, 3).map((q) => ({
    query: String(q.query || brand),
    mentions: clamp(q.mentions, 0, 999),
    accuracy: clamp(q.accuracy),
    trend: (["up", "down", "stable"].includes(q.trend) ? q.trend : "stable") as "up" | "down" | "stable",
  }));
  const canonicalFacts = (raw.canonicalFacts ?? []).slice(0, 6).map((f) => ({
    fact: String(f.fact || ""),
    status: (["accurate", "violated", "missing"].includes(f.status) ? f.status : "missing") as "accurate" | "violated" | "missing",
    violations: clamp(f.violations, 0, 9),
  }));
  return {
    brandScore: clamp(raw.brandScore),
    soa: clamp(raw.soa),
    accuracy: clamp(raw.accuracy),
    citation: clamp(raw.citation),
    engines,
    alerts: alerts.length ? alerts : [{ severity: "medium", engine: "ChatGPT", query: brand, issue: `Limited information about ${brand}` }],
    topQueries: topQueries.length ? topQueries : [{ query: brand, mentions: 1, accuracy: 50, trend: "stable" }],
    canonicalFacts: canonicalFacts.length ? canonicalFacts : [{ fact: `${brand} is a Web3 project`, status: "missing", violations: 1 }],
  };
}

// Queries Claude for a real assessment of how AI engines represent the brand.
export async function analyzeBrandVisibility(brand: string): Promise<BrandCore> {
  const res = await getClient().messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Assess the AI search visibility of the Web3 project "${brand}". Fill every field of the schema based on what these AI engines actually say about it today.`,
      },
    ],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("ai_no_output");
  const parsed = JSON.parse(block.text) as BrandCore;
  return normalize(parsed, brand);
}
