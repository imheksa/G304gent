// Wikidata (MediaWiki Action API) client for the Distribute pillar.
// Supports two auth modes:
//   - OAuth 2.0 (preferred, smoother): the user connects their Wikimedia
//     account once; edits use a Bearer token.
//   - Bot password (fallback when OAuth isn't configured): the user pastes a
//     Special:BotPasswords credential, used transiently.
// Dependency-free (plain fetch + cookies).

const ACTION_API = "https://www.wikidata.org/w/api.php";
const OAUTH_BASE = "https://meta.wikimedia.org/w/rest.php/oauth2";
const UA = "6304Agent/1.0 (https://geoagents.xyz; GEO distribution)";

// Properties we map. datatype drives how the value is serialized.
const PROPS: Record<string, { pid: string; label: string; kind: "url" | "extid" }> = {
  website: { pid: "P856", label: "official website", kind: "url" },
  twitter: { pid: "P2002", label: "X/Twitter", kind: "extid" },
  blog: { pid: "P1581", label: "official blog", kind: "url" },
  instagram: { pid: "P2003", label: "Instagram", kind: "extid" },
};

// Reference (source) property attached to each statement for verifiability.
const P_REF_URL = "P854"; // reference URL

export type Auth = { cookies?: string; bearer?: string };

type Jar = string;

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
  auth: Auth
): Promise<{ json: any; cookies: Jar }> {
  const form = new URLSearchParams({ ...params, format: "json" });
  const url = method === "GET" ? `${ACTION_API}?${form.toString()}` : ACTION_API;
  const res = await fetch(url, {
    method,
    headers: {
      "User-Agent": UA,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(auth.cookies ? { Cookie: auth.cookies } : {}),
      ...(auth.bearer ? { Authorization: `Bearer ${auth.bearer}` } : {}),
    },
    body: method === "POST" ? form.toString() : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { json, cookies: mergeCookies(auth.cookies || "", setCookieOf(res)) };
}

// --- Public search (unauthenticated) ---

export type WikidataMatch = { id: string; label: string; description: string; url: string };
export async function searchItems(name: string): Promise<WikidataMatch[]> {
  const { json } = await apiCall(
    { action: "wbsearchentities", search: name, language: "en", uselang: "en", type: "item", limit: "5" },
    "GET",
    {}
  );
  return ((json?.search ?? []) as any[]).map((r) => ({
    id: String(r.id),
    label: String(r.label ?? name),
    description: String(r.description ?? ""),
    url: `https://www.wikidata.org/wiki/${r.id}`,
  }));
}

// --- OAuth 2.0 ---

export function oauthConfigured(): boolean {
  return Boolean(process.env.WIKIDATA_OAUTH_CLIENT_ID && process.env.WIKIDATA_OAUTH_CLIENT_SECRET);
}

export function authorizeUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: process.env.WIKIDATA_OAUTH_CLIENT_ID || "",
    redirect_uri: redirectUri,
    state,
  });
  return `${OAUTH_BASE}/authorize?${p.toString()}`;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const res = await fetch(`${OAUTH_BASE}/access_token`, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.WIKIDATA_OAUTH_CLIENT_ID || "",
      client_secret: process.env.WIKIDATA_OAUTH_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
    }).toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.access_token) throw new Error(json.error_description || json.error || "token exchange failed");
  return String(json.access_token);
}

// Returns the logged-in Wikimedia username for a Bearer token, or null.
export async function whoAmI(bearer: string): Promise<string | null> {
  const { json } = await apiCall({ action: "query", meta: "userinfo" }, "GET", { bearer });
  const name = json?.query?.userinfo?.name;
  return name && !json?.query?.userinfo?.anon ? String(name) : null;
}

// --- Bot password login ---

async function login(username: string, password: string): Promise<Auth> {
  const t = await apiCall({ action: "query", meta: "tokens", type: "login" }, "GET", {});
  const loginToken = t.json?.query?.tokens?.logintoken;
  if (!loginToken) throw new Error("could not obtain login token");
  const r = await apiCall(
    { action: "login", lgname: username, lgpassword: password, lgtoken: loginToken },
    "POST",
    { cookies: t.cookies }
  );
  if (r.json?.login?.result !== "Success") {
    throw new Error(`login failed: ${r.json?.login?.result || "unknown"} — check your bot password`);
  }
  return { cookies: r.cookies };
}

// --- Value helpers + claim builder ---

function normUrl(u: string): string {
  const v = (u || "").trim();
  return v && !v.startsWith("http") ? `https://${v}` : v;
}
function handle(u: string): string {
  const v = (u || "").trim();
  const m = v.match(/(?:twitter\.com|x\.com|instagram\.com)\/@?([A-Za-z0-9_.]{1,30})/i);
  return (m ? m[1] : v.replace(/^@/, "")).replace(/\/+$/, "");
}

// Reference groups (sources) attached to every statement, for verifiability.
function buildRefs(sources: string[] | undefined) {
  const clean = (sources ?? []).map(normUrl).filter(Boolean).slice(0, 3);
  if (!clean.length) return undefined;
  return clean.map((url) => ({
    snaks: { [P_REF_URL]: [{ snaktype: "value", property: P_REF_URL, datavalue: { value: url, type: "string" } }] },
  }));
}

function snak(pid: string, value: string, refs?: ReturnType<typeof buildRefs>) {
  // Both url and external-id datatypes serialize as a plain string value.
  const claim: any = {
    mainsnak: { snaktype: "value", property: pid, datavalue: { value, type: "string" } },
    type: "statement",
    rank: "normal",
  };
  if (refs) claim.references = refs;
  return claim;
}

export type WikidataIdentity = {
  name: string;
  description?: string;
  website?: string;
  twitter?: string;
  blog?: string;
  instagram?: string;
  sources?: string[]; // up to 3 reference URLs attached to each statement
};

function normalized(id: WikidataIdentity): { key: string; pid: string; label: string; value: string }[] {
  const out: { key: string; pid: string; label: string; value: string }[] = [];
  const push = (key: keyof typeof PROPS, value: string) => {
    if (value) out.push({ key, pid: PROPS[key].pid, label: PROPS[key].label, value });
  };
  push("website", normUrl(id.website || ""));
  push("twitter", id.twitter ? handle(id.twitter) : "");
  push("blog", normUrl(id.blog || ""));
  push("instagram", id.instagram ? handle(id.instagram) : "");
  return out;
}

// Human-readable preview of what would be written (used by the UI too, via the API).
export function previewClaims(id: WikidataIdentity): string[] {
  return normalized(id).map((n) => `${n.label} (${n.pid}): ${n.value}`);
}

export type WikidataResult = { id: string; url: string; added: string[]; created: boolean };

async function csrfToken(auth: Auth): Promise<string> {
  const { json } = await apiCall({ action: "query", meta: "tokens", type: "csrf" }, "GET", auth);
  const token = json?.query?.tokens?.csrftoken;
  if (!token || token === "+\\") throw new Error("could not obtain edit token — is your account authorized to edit?");
  return token;
}

// Create a new item or add missing statements to an existing one.
export async function submitToWikidata(
  auth: Auth,
  id: WikidataIdentity,
  mode: "create" | "existing",
  qid?: string
): Promise<WikidataResult> {
  const props = normalized(id);
  const refs = buildRefs(id.sources);
  const token = await csrfToken(auth);

  if (mode === "create") {
    // Wikidata caps labels and descriptions at 250 characters.
    const data: any = { labels: { en: { language: "en", value: id.name.slice(0, 250) } }, claims: props.map((p) => snak(p.pid, p.value, refs)) };
    if (id.description?.trim()) data.descriptions = { en: { language: "en", value: id.description.trim().slice(0, 250) } };
    const r = await apiCall(
      { action: "wbeditentity", new: "item", data: JSON.stringify(data), token, assert: "user", summary: "Add project identity via 6304 Agent" },
      "POST",
      auth
    );
    if (r.json?.error) throw new Error(`${r.json.error.code}: ${r.json.error.info}`);
    const newId = String(r.json?.entity?.id || "");
    return { id: newId, url: `https://www.wikidata.org/wiki/${newId}`, added: props.map((p) => p.label), created: true };
  }

  const target = String(qid || "").trim().toUpperCase();
  if (!/^Q\d+$/.test(target)) throw new Error("a valid existing item QID is required");
  const get = await apiCall({ action: "wbgetentities", ids: target, props: "claims" }, "GET", auth);
  const existing = get.json?.entities?.[target]?.claims ?? {};
  const toAdd = props.filter((p) => !existing[p.pid]);
  if (toAdd.length === 0) return { id: target, url: `https://www.wikidata.org/wiki/${target}`, added: [], created: false };

  const r = await apiCall(
    { action: "wbeditentity", id: target, data: JSON.stringify({ claims: toAdd.map((p) => snak(p.pid, p.value, refs)) }), token, assert: "user", summary: "Add official facts via 6304 Agent" },
    "POST",
    auth
  );
  if (r.json?.error) throw new Error(`${r.json.error.code}: ${r.json.error.info}`);
  return { id: target, url: `https://www.wikidata.org/wiki/${target}`, added: toAdd.map((p) => p.label), created: false };
}

export { login };
