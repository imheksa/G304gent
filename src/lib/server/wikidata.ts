// Minimal Wikidata (MediaWiki Action API) client for the Distribute pillar.
// Authenticates with a user-provided *bot password* (Special:BotPasswords on
// wikidata.org) so edits are attributed to the user's own account, then reads/
// writes structured statements. Kept dependency-free (plain fetch + cookies).

const API = "https://www.wikidata.org/w/api.php";
const UA = "6304Agent/1.0 (https://geoagents.xyz; GEO distribution)";

// Property IDs we can map reliably and safely.
const P_WEBSITE = "P856"; // official website (url)
const P_TWITTER = "P2002"; // X/Twitter username (external-id)

type Jar = string; // serialized "k=v; k2=v2"

function mergeCookies(prev: Jar, setCookie: string[]): Jar {
  const jar = new Map<string, string>();
  for (const pair of prev.split("; ").filter(Boolean)) {
    const i = pair.indexOf("=");
    if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  for (const sc of setCookie) {
    const first = sc.split(";")[0];
    const i = first.indexOf("=");
    if (i > 0) jar.set(first.slice(0, i).trim(), first.slice(i + 1).trim());
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

function setCookieOf(res: Response): string[] {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const one = res.headers.get("set-cookie");
  return one ? [one] : [];
}

async function apiCall(
  params: Record<string, string>,
  method: "GET" | "POST",
  cookies: Jar
): Promise<{ json: any; cookies: Jar }> {
  const body = new URLSearchParams({ ...params, format: "json" });
  const url = method === "GET" ? `${API}?${body.toString()}` : API;
  const res = await fetch(url, {
    method,
    headers: {
      "User-Agent": UA,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: method === "POST" ? body.toString() : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { json, cookies: mergeCookies(cookies, setCookieOf(res)) };
}

// Public, unauthenticated: does an item for this name already exist?
export type WikidataMatch = { id: string; label: string; description: string; url: string };
export async function searchItems(name: string): Promise<WikidataMatch[]> {
  const { json } = await apiCall(
    { action: "wbsearchentities", search: name, language: "en", uselang: "en", type: "item", limit: "5" },
    "GET",
    ""
  );
  const rows = (json?.search ?? []) as any[];
  return rows.map((r) => ({
    id: String(r.id),
    label: String(r.label ?? name),
    description: String(r.description ?? ""),
    url: `https://www.wikidata.org/wiki/${r.id}`,
  }));
}

// Log in with a bot password. Returns the authenticated cookie jar or throws.
async function login(username: string, password: string): Promise<Jar> {
  const t = await apiCall({ action: "query", meta: "tokens", type: "login" }, "GET", "");
  const loginToken = t.json?.query?.tokens?.logintoken;
  if (!loginToken) throw new Error("could not obtain login token");
  const r = await apiCall(
    { action: "login", lgname: username, lgpassword: password, lgtoken: loginToken },
    "POST",
    t.cookies
  );
  if (r.json?.login?.result !== "Success") {
    throw new Error(`login failed: ${r.json?.login?.result || "unknown"} — check your bot password`);
  }
  return r.cookies;
}

function normUrl(u: string): string {
  const v = (u || "").trim();
  if (!v) return "";
  return v.startsWith("http") ? v : `https://${v}`;
}

function twitterHandle(u: string): string {
  const v = (u || "").trim();
  if (!v) return "";
  const m = v.match(/(?:twitter\.com|x\.com)\/@?([A-Za-z0-9_]{1,15})/i);
  if (m) return m[1];
  return v.replace(/^@/, "").replace(/\/+$/, "");
}

function urlClaim(property: string, value: string) {
  return {
    mainsnak: { snaktype: "value", property, datavalue: { value, type: "string" } },
    type: "statement",
    rank: "normal",
  };
}

export type WikidataSubmit = {
  username: string;
  password: string;
  name: string;
  description?: string;
  website?: string;
  twitter?: string;
  mode: "create" | "existing";
  qid?: string;
};

export type WikidataResult = { id: string; url: string; added: string[]; created: boolean };

// Submit the brand's structured identity to Wikidata: creates a new item or
// adds the official website / X handle to an existing one (skipping any that
// are already present, so no duplicate statements).
export async function submitToWikidata(input: WikidataSubmit): Promise<WikidataResult> {
  const website = normUrl(input.website || "");
  const handle = twitterHandle(input.twitter || "");
  const cookies = await login(input.username.trim(), input.password.trim());

  const csrf = await apiCall({ action: "query", meta: "tokens", type: "csrf" }, "GET", cookies);
  const token = csrf.json?.query?.tokens?.csrftoken;
  if (!token) throw new Error("could not obtain edit token");

  const added: string[] = [];

  if (input.mode === "create") {
    const claims: any[] = [];
    if (website) { claims.push(urlClaim(P_WEBSITE, website)); added.push("official website"); }
    if (handle) { claims.push(urlClaim(P_TWITTER, handle)); added.push("X/Twitter"); }
    const data: any = { labels: { en: { language: "en", value: input.name } }, claims };
    if (input.description?.trim()) data.descriptions = { en: { language: "en", value: input.description.trim() } };
    const r = await apiCall(
      { action: "wbeditentity", new: "item", data: JSON.stringify(data), token, assert: "user", summary: "Add project identity via 6304 Agent" },
      "POST",
      cookies
    );
    if (r.json?.error) throw new Error(`${r.json.error.code}: ${r.json.error.info}`);
    const id = String(r.json?.entity?.id || "");
    return { id, url: `https://www.wikidata.org/wiki/${id}`, added, created: true };
  }

  // Existing item: fetch current claims, only add what's missing.
  const qid = String(input.qid || "").trim();
  if (!/^Q\d+$/.test(qid)) throw new Error("a valid existing item QID is required");
  const get = await apiCall({ action: "wbgetentities", ids: qid, props: "claims" }, "GET", cookies);
  const existing = get.json?.entities?.[qid]?.claims ?? {};
  const claims: any[] = [];
  if (website && !existing[P_WEBSITE]) { claims.push(urlClaim(P_WEBSITE, website)); added.push("official website"); }
  if (handle && !existing[P_TWITTER]) { claims.push(urlClaim(P_TWITTER, handle)); added.push("X/Twitter"); }
  if (claims.length === 0) return { id: qid, url: `https://www.wikidata.org/wiki/${qid}`, added: [], created: false };

  const r = await apiCall(
    { action: "wbeditentity", id: qid, data: JSON.stringify({ claims }), token, assert: "user", summary: "Add official channels via 6304 Agent" },
    "POST",
    cookies
  );
  if (r.json?.error) throw new Error(`${r.json.error.code}: ${r.json.error.info}`);
  return { id: qid, url: `https://www.wikidata.org/wiki/${qid}`, added, created: false };
}
