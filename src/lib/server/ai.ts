import type { BrandCore, EngineName } from "@/lib/brand-data";

// Real multi-engine GEO measurement via OpenRouter (one API key → many models).
// Each AI engine is queried for what it knows about the brand, then a judge
// model scores every answer. Disabled (falls back to the generator) when
// OPENROUTER_API_KEY isn't set.
const apiKey = process.env.OPENROUTER_API_KEY || "";
export const aiEnabled = apiKey.length > 0;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// The engines shown in the dashboard, mapped to an OpenRouter model slug. Cheap
// models keep a scan to a few cents. Override the slugs via env if a model is
// renamed/retired (JSON map of engine name → slug).
const DEFAULT_ENGINE_MODELS: Record<EngineName, string> = {
  ChatGPT: "openai/gpt-4o-mini",
  Gemini: "google/gemini-flash-1.5",
  Claude: "anthropic/claude-3.5-haiku",
  Grok: "x-ai/grok-2-1212",
  Deepseek: "deepseek/deepseek-chat",
  "Google AI": "google/gemini-2.0-flash-001",
};

function engineModels(): Record<EngineName, string> {
  try {
    const override = process.env.OPENROUTER_ENGINE_MODELS;
    if (override) return { ...DEFAULT_ENGINE_MODELS, ...JSON.parse(override) };
  } catch {
    /* ignore malformed override */
  }
  return DEFAULT_ENGINE_MODELS;
}

// The model that scores every engine's answer. Must support JSON-schema output.
const JUDGE_MODEL = process.env.OPENROUTER_JUDGE_MODEL || "openai/gpt-4o-mini";

const ENGINES: EngineName[] = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];

async function callOpenRouter(
  body: Record<string, unknown>,
  timeoutMs = 30000
): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "6304 Agent",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`openrouter ${res.status}`);
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("openrouter_no_content");
    return content;
  } finally {
    clearTimeout(t);
  }
}

const QUERY_PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["direct", "indirect"],
  properties: {
    direct: { type: "array", description: "3 questions that explicitly name the project", items: { type: "string" } },
    indirect: { type: "array", description: "7 category questions that do NOT name the project", items: { type: "string" } },
  },
} as const;

// The brand's identity, used to disambiguate it from same-named entities.
export type BrandContext = { website?: string; twitter?: string };

function identityLine(brand: string, ctx?: BrandContext): string {
  const bits: string[] = [];
  if (ctx?.website) bits.push(`website ${ctx.website}`);
  if (ctx?.twitter) bits.push(`X/Twitter ${ctx.twitter}`);
  return bits.length ? `${brand} (identified by ${bits.join(", ")})` : brand;
}

// Builds a mixed query battery per brand: 3 direct (name the brand) + 7 indirect
// (category questions that don't name it — testing unprompted mention). Generated
// dynamically so it works for any brand or competitor. Falls back to templates.
// The indirect questions are deliberately open-ended "best/top X" category
// questions where the brand may legitimately NOT appear — that is the honest
// signal we measure (e.g. for Bitcoin: "Top 10 blockchains by TPS" — Bitcoin
// won't be in it; "Best smart-contract platforms" — Bitcoin isn't one).
async function planQueries(brand: string, ctx?: BrandContext): Promise<{ direct: string[]; indirect: string[] }> {
  const identity = identityLine(brand, ctx);
  try {
    const content = await callOpenRouter(
      {
        model: JUDGE_MODEL,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Generate Generative-Engine-Optimization test queries for the Web3 project ${identity}. Return JSON with two arrays of natural user search questions:
- "direct": exactly 3 questions that explicitly name ${brand} (e.g. "What is ${brand}?", "Is ${brand} safe?", "What are ${brand}'s fees?").
- "indirect": exactly 7 realistic questions about ${brand}'s category/use-case that do NOT mention ${brand} by name. Infer the category from the identity above. Write them as genuine, competitive discovery questions a user would ask WITHOUT knowing ${brand} exists — ranked lists and "best/top" comparisons where ${brand} may or may not be surfaced (e.g. "Top 10 blockchains by TPS", "Best smart-contract platforms in 2025", "Which DEX has the lowest fees?", "Where can I earn the highest yield on stablecoins?"). Do NOT bias the questions toward ${brand}; if ${brand} genuinely wouldn't be a top answer, that is fine — we are measuring honest unprompted visibility.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "query_plan", strict: true, schema: QUERY_PLAN_SCHEMA },
        },
      },
      20000
    );
    const p = JSON.parse(content) as { direct?: unknown[]; indirect?: unknown[] };
    const direct = (p.direct ?? []).slice(0, 3).map(String);
    const indirect = (p.indirect ?? []).slice(0, 7).map(String);
    if (direct.length && indirect.length) return { direct, indirect };
  } catch {
    /* fall through to templates */
  }
  return {
    direct: [
      `What is ${brand}?`,
      `Is ${brand} safe and has it been audited?`,
      `What are ${brand}'s fees and tokenomics?`,
    ],
    indirect: [
      `What are the leading Web3 projects right now?`,
      `Which crypto platform has the lowest fees?`,
      `What is the most reliable blockchain network?`,
      `Which on-chain projects are considered the safest?`,
      `What are the best alternatives for crypto users today?`,
      `Which projects have the strongest developer activity?`,
      `Where should a new crypto user start today?`,
    ],
  };
}

// Ask one engine the full battery of queries in a single neutral call (so the
// indirect answers aren't biased toward the brand). Returns null on failure.
async function queryEngine(model: string, queries: string[]): Promise<string | null> {
  const list = queries.map((q, i) => `${i + 1}. ${q}`).join("\n");
  try {
    return await callOpenRouter({
      model,
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: `Answer each of the following questions briefly (1-2 sentences each). If you are unsure, say so for that item.\n\n${list}`,
        },
      ],
    });
  } catch {
    return null;
  }
}

const JUDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brandScore", "soa", "accuracy", "citation", "engines", "alerts", "topQueries", "canonicalFacts", "recommendations"],
  properties: {
    brandScore: { type: "integer" },
    soa: { type: "integer" },
    accuracy: { type: "integer" },
    citation: { type: "integer" },
    engines: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "status", "accuracy", "soa", "sentiment"],
        properties: {
          name: { type: "string", enum: ENGINES },
          status: { type: "string", enum: ["mentioned", "not_found"] },
          accuracy: { type: "integer" },
          soa: { type: "integer" },
          sentiment: { type: "integer", description: "How positive the engine's portrayal is, 0-100" },
        },
      },
    },
    alerts: {
      type: "array",
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
      description: "8-10 representative user queries about the brand (one per query the engines were asked)",
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
    recommendations: {
      type: "array",
      description: "3-5 concrete, prioritized GEO actions this specific project can take to improve how AI engines surface and describe it, based ONLY on the gaps observed in the responses (e.g. where it was missing on indirect queries or facts were wrong). Each must be an actionable step, not a platitude.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["action", "priority"],
        properties: {
          action: { type: "string", description: "A specific, doable action, e.g. 'Publish a comparison page targeting \"best low-fee DEX\" — you were absent from that query on 4/6 engines.'" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
  },
} as const;

const JUDGE_SYSTEM = `You are 6304 Agent, a Generative Engine Optimization (GEO) analyst for Web3.
You are given the actual responses several AI engines gave about a Web3 project. Score how well each engine represents the project:
- status "mentioned" if the engine gave substantive, on-topic information; "not_found" if it didn't recognize the project or gave nothing useful.
- accuracy 0-100: are the facts (fees, audits, custody, tokenomics, launch year, TVL) correct and current.
- soa 0-100: how prominent/complete the project is in that engine's answer.
- sentiment 0-100: how positive/favorable the engine's portrayal of the project is (50 = neutral).
Only treat mentions as the SAME project when they match the given identity (website/category); ignore unrelated same-named entities.
BE HONEST — DO NOT INFLATE. The identity details (website, socials, category) are provided ONLY to disambiguate the project from same-named entities. They are NOT evidence that the project is well-known and must NEVER raise the scores. Score strictly on what the engines ACTUALLY said. If an engine did not surface the project, its scores for that engine are 0 — no matter how detailed the provided identity is.
The engines were asked a mix of DIRECT queries (that name the project) and INDIRECT queries (category "best/top" questions that don't). The most important visibility signal is whether the engine surfaces the project UNPROMPTED on indirect queries. If the project genuinely would not be a top answer to an indirect query and the engine didn't name it, that item is a real zero for Share of Answer — report it as zero, do not give partial credit. A low or zero score is the correct, useful output when the project simply isn't visible.
Then give overall brandScore, share of answer (soa), accuracy, and citation (how often engines cite it as a source). List concrete misinformation as alerts, use the 10 asked questions as topQueries (mark whether the project appeared), and key project facts with whether engines represent them correctly as canonicalFacts. Finally, given the observed gaps (especially indirect queries where the project was absent), produce recommendations: concrete, prioritized GEO actions to improve real visibility — this is how the user improves a low score honestly rather than by inflating it. Base everything on the provided responses. Output only the structured fields.`;

function clamp(n: unknown, lo = 0, hi = 100): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(lo, Math.min(hi, v));
}

// Coerce the judge output into a safe, complete BrandCore. Engines that failed
// to respond are forced to "not_found" regardless of what the judge guessed.
function normalize(raw: BrandCore, brand: string, failed: Set<EngineName>): BrandCore {
  const byName = new Map((raw.engines ?? []).map((e) => [e.name, e]));
  const engines = ENGINES.map((name) => {
    const e = byName.get(name);
    const found = !failed.has(name) && e?.status !== "not_found";
    return {
      name,
      status: (found ? "mentioned" : "not_found") as "mentioned" | "not_found",
      accuracy: found ? clamp(e?.accuracy) : 0,
      soa: found ? clamp(e?.soa) : 0,
      sentiment: found ? clamp(e?.sentiment) : 0,
    };
  });
  const alerts = (raw.alerts ?? []).slice(0, 5).map((a) => ({
    severity: (["high", "medium", "low"].includes(a.severity) ? a.severity : "medium") as "high" | "medium" | "low",
    engine: String(a.engine || "ChatGPT"),
    query: String(a.query || brand),
    issue: String(a.issue || `Inaccurate information about ${brand}`),
  }));
  const topQueries = (raw.topQueries ?? []).slice(0, 10).map((q) => ({
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
  const recommendations = (raw.recommendations ?? []).slice(0, 5).map((r) => ({
    action: String(r.action || ""),
    priority: (["high", "medium", "low"].includes(r.priority) ? r.priority : "medium") as "high" | "medium" | "low",
  })).filter((r) => r.action);
  return {
    brandScore: clamp(raw.brandScore),
    soa: clamp(raw.soa),
    accuracy: clamp(raw.accuracy),
    citation: clamp(raw.citation),
    engines,
    alerts: alerts.length ? alerts : [{ severity: "medium", engine: "ChatGPT", query: brand, issue: `Limited information about ${brand}` }],
    topQueries: topQueries.length ? topQueries : [{ query: brand, mentions: 1, accuracy: 50, trend: "stable" }],
    canonicalFacts: canonicalFacts.length ? canonicalFacts : [{ fact: `${brand} is a Web3 project`, status: "missing", violations: 1 }],
    recommendations: recommendations.length ? recommendations : [{ action: `Publish clear, factual pages about ${brand} (what it is, category, fees, audits) so AI engines can surface it on category questions.`, priority: "high" }],
  };
}

// Progress events emitted during a streaming scan.
export type ScanEvent =
  | { type: "engine_start"; name: EngineName }
  | { type: "engine_done"; name: EngineName; found: boolean }
  | { type: "judge_start" };

// Queries every engine for real, then has the judge score the answers. Also
// returns the raw engine responses so the UI can show them ("View Response").
// onEvent (optional) receives per-engine progress for streaming scans.
export async function analyzeBrandVisibility(
  brand: string,
  onEvent: (e: ScanEvent) => void = () => {},
  ctx?: BrandContext
): Promise<{ core: BrandCore; responses: Record<string, string> }> {
  const models = engineModels();

  // 0. Plan a mixed query battery (3 direct + 7 indirect) for this brand.
  const plan = await planQueries(brand, ctx);
  const queries = [...plan.direct, ...plan.indirect];

  // 1. Query all engines in parallel with the full query battery, emitting a
  // start/done event for each as it resolves.
  const answers = await Promise.all(
    ENGINES.map(async (name) => {
      onEvent({ type: "engine_start", name });
      const text = await queryEngine(models[name], queries);
      onEvent({ type: "engine_done", name, found: Boolean(text) });
      return { name, text };
    })
  );
  const failed = new Set<EngineName>(answers.filter((a) => !a.text).map((a) => a.name));
  const responses: Record<string, string> = {};
  for (const a of answers) if (a.text) responses[a.name] = a.text.trim();

  onEvent({ type: "judge_start" });

  // 2. Judge scores every engine's answer, with the direct/indirect split.
  const transcript = answers
    .map((a) => `### ${a.name}\n${a.text ? a.text.trim() : "(no response — engine did not recognize the project)"}`)
    .join("\n\n");

  const queryContext = [
    "DIRECT queries (explicitly name the project):",
    ...plan.direct.map((q, i) => `  D${i + 1}. ${q}`),
    "",
    "INDIRECT queries (category questions that do NOT name the project — the project is only 'present' if the engine mentioned it unprompted):",
    ...plan.indirect.map((q, i) => `  I${i + 1}. ${q}`),
  ].join("\n");

  const content = await callOpenRouter(
    {
      model: JUDGE_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: JUDGE_SYSTEM },
        {
          role: "user",
          content: `Project: ${identityLine(brand, ctx)}\n\nIMPORTANT — identity check: only count an engine's answer as being about THIS project if it clearly refers to the same entity (matching website/category above). If an engine discusses a different entity that merely shares the name, treat the project as NOT present for that item.\n\nThe engines were each asked these 10 questions:\n${queryContext}\n\nHere is what each AI engine answered (all 10 in order):\n\n${transcript}\n\nScore each engine and the project overall. For INDIRECT queries, only count the project as present/visible if the engine named it (as this exact entity) without being prompted — that is the key visibility signal. Use these 10 queries as the topQueries.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "brand_visibility", strict: true, schema: JUDGE_SCHEMA },
      },
    },
    45000
  );

  const parsed = JSON.parse(content) as BrandCore;
  return { core: normalize(parsed, brand, failed), responses };
}
