// "AI distribution surfaces" — high-authority sources AI engines cite for
// crypto. We can only *check presence* (via public APIs) and point to the right
// submission path; none of these (unlike Wikidata) offer an open write API.

async function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "6304Agent/1.0 (https://geoagents.xyz)" } });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// listed: true = found, false = not found, null = check failed/unavailable.
export type Surface = {
  key: string;
  name: string;
  note: string;
  listed: boolean | null;
  url?: string;
  submitUrl?: string;
};

async function checkCoinGecko(name: string): Promise<{ listed: boolean | null; url?: string }> {
  try {
    const j = await fetchJson(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(name)}`);
    const coins: any[] = j?.coins ?? [];
    const lc = name.toLowerCase();
    const m = coins.find((c) => c?.name?.toLowerCase() === lc || c?.symbol?.toLowerCase() === lc) ?? coins[0];
    if (m?.id && (coins.some((c) => c?.name?.toLowerCase() === lc || c?.symbol?.toLowerCase() === lc)))
      return { listed: true, url: `https://www.coingecko.com/en/coins/${m.id}` };
    return { listed: false };
  } catch {
    return { listed: null };
  }
}

// DefiLlama has no search endpoint, so we fetch the full protocol list and match
// by name. Cached in-memory per warm lambda to avoid re-downloading ~2MB.
let llamaCache: { t: number; data: any[] } | null = null;
async function llamaProtocols(): Promise<any[]> {
  if (llamaCache && Date.now() - llamaCache.t < 15 * 60 * 1000) return llamaCache.data;
  const data = await fetchJson("https://api.llama.fi/protocols", 12000);
  if (Array.isArray(data)) llamaCache = { t: Date.now(), data };
  return Array.isArray(data) ? data : [];
}

async function checkDefiLlama(name: string): Promise<{ listed: boolean | null; url?: string }> {
  try {
    const list = await llamaProtocols();
    const lc = name.toLowerCase();
    const m = list.find((p) => p?.name?.toLowerCase() === lc);
    if (m?.slug) return { listed: true, url: `https://defillama.com/protocol/${m.slug}` };
    return { listed: false };
  } catch {
    return { listed: null };
  }
}

export async function checkSurfaces(name: string): Promise<Surface[]> {
  const [cg, dl] = await Promise.all([checkCoinGecko(name), checkDefiLlama(name)]);
  return [
    {
      key: "coingecko",
      name: "CoinGecko",
      note: "Price & market data widely cited by AI answers.",
      listed: cg.listed,
      url: cg.url,
      submitUrl: "https://www.coingecko.com/en/coins/new",
    },
    {
      key: "defillama",
      name: "DefiLlama",
      note: "TVL & protocol data — a primary DeFi source.",
      listed: dl.listed,
      url: dl.url,
      submitUrl: "https://docs.llama.fi/list-your-project",
    },
    {
      key: "coinmarketcap",
      name: "CoinMarketCap",
      note: "Manual listing request (no open API check).",
      listed: null,
      submitUrl: "https://support.coinmarketcap.com/hc/en-us/articles/360043659351",
    },
  ];
}
