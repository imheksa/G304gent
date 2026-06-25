export function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateData(brand: string) {
  const s = hash(brand);
  const brandScore = 35 + (s % 45);
  const soa = 10 + (s % 40);
  const accuracy = 50 + ((s * 3) % 40);
  const citation = 5 + ((s * 7) % 25);

  const summaryCards = [
    { label: "Brand Score", value: String(brandScore), change: `+${1 + (s % 8)}`, unit: "/100", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Share of Answer", value: String(soa), change: `+${1 + ((s * 2) % 10)}`, unit: "%", color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Accuracy Score", value: String(accuracy), change: accuracy > 70 ? `+${1 + (s % 4)}` : `-${1 + (s % 5)}`, unit: "%", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Citation Rate", value: String(citation), change: `+${1 + ((s * 5) % 6)}`, unit: "%", color: "text-amber-400", bg: "bg-amber-500/10" },
  ];

  const engineBase = [
    { name: "ChatGPT", icon: "G", lastChecked: "2 min ago" },
    { name: "Gemini", icon: "Gm", lastChecked: "3 min ago" },
    { name: "Claude", icon: "C", lastChecked: "4 min ago" },
    { name: "Grok", icon: "Gr", lastChecked: "5 min ago" },
    { name: "Deepseek", icon: "D", lastChecked: "6 min ago" },
    { name: "Google AI", icon: "GA", lastChecked: "8 min ago" },
  ];
  const missingIdx = s % 6;
  const engines = engineBase.map((e, i) => ({
    ...e,
    status: i === missingIdx ? "not_found" as const : "mentioned" as const,
    accuracy: i === missingIdx ? 0 : 60 + ((s * (i + 1) * 3) % 35),
    soa: i === missingIdx ? 0 : 15 + ((s * (i + 1) * 7) % 40),
  }));

  const severities = ["high", "high", "medium", "low", "medium"];
  const engineNames = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];
  const issueTemplates = [
    `States incorrect launch year for ${brand}`,
    `Claims wrong trading fees about ${brand}`,
    `Lists outdated tokenomics as current for ${brand}`,
    `Missing smart contract audit info for ${brand}`,
    `Does not mention the non-custodial design of ${brand}`,
  ];
  const queryTemplates = [
    `best ${brand.toLowerCase()} alternatives`,
    `${brand} trading fees`,
    `${brand.toLowerCase()} vs competitors`,
    `is ${brand.toLowerCase()} safe`,
    `${brand} review`,
  ];
  const times = ["12 min ago", "25 min ago", "1 hr ago", "2 hr ago", "3 hr ago"];
  const alerts = issueTemplates.map((issue, i) => ({
    id: i + 1,
    severity: severities[i],
    engine: engineNames[(s + i) % 4],
    query: queryTemplates[i],
    issue,
    time: times[i],
  }));

  const baseSoa = 8 + (s % 15);
  const soaTrend = [
    { week: "W1", you: baseSoa, competitor: 40 + (s % 10) },
    { week: "W2", you: baseSoa + 3, competitor: 39 + (s % 10) },
    { week: "W3", you: baseSoa + 6, competitor: 38 + (s % 10) },
    { week: "W4", you: baseSoa + 10, competitor: 37 + (s % 10) },
    { week: "W5", you: baseSoa + 13, competitor: 36 + (s % 10) },
    { week: "W6", you: soa, competitor: 35 + (s % 10) },
  ];

  const topQueries = [
    { query: `best ${brand.toLowerCase()} alternatives`, mentions: 8 + (s % 8), accuracy: 70 + ((s * 3) % 25), trend: "up" },
    { query: `${brand} review`, mentions: 5 + ((s * 2) % 6), accuracy: 60 + ((s * 7) % 30), trend: "up" },
    { query: `${brand.toLowerCase()} pricing`, mentions: 3 + ((s * 4) % 5), accuracy: 55 + ((s * 11) % 35), trend: "stable" },
  ];

  const factStatuses = ["violated", "violated", "missing", "missing", "accurate", "accurate"];
  const factTemplates = [
    `Launched in ${2018 + (s % 6)}`,
    "Non-custodial protocol",
    "Audited by CertiK",
    "Open-source smart contracts",
    `$${1 + (s % 9)}.${s % 9}B Total Value Locked`,
    "Multi-chain support enabled",
  ];
  const canonicalFacts = factTemplates.map((fact, i) => ({
    fact,
    status: factStatuses[i],
    violations: factStatuses[i] === "accurate" ? 0 : 1 + (s % 2),
  }));

  return { brandScore, soa, accuracy, citation, summaryCards, engines, alerts, soaTrend, topQueries, canonicalFacts };
}

export type BrandData = ReturnType<typeof generateData>;

export type BrandProfile = {
  name: string;
  website: string;
  blog: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  createdAt: string;
};

const BRANDS_KEY = "g304_brands";

export function getSavedBrands(): string[] {
  return getBrandProfiles().map((b) => b.name);
}

export function getBrandProfiles(): BrandProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BRANDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      const migrated: BrandProfile[] = parsed.map((name: string) => ({
        name,
        website: "",
        blog: "",
        twitter: "",
        instagram: "",
        linkedin: "",
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(BRANDS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed as BrandProfile[];
  } catch {
    return [];
  }
}

export function saveBrandProfile(profile: BrandProfile) {
  const profiles = getBrandProfiles();
  const existing = profiles.findIndex((p) => p.name === profile.name);
  if (existing >= 0) {
    profiles[existing] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(BRANDS_KEY, JSON.stringify(profiles));
}

export function saveBrand(brand: string) {
  const profiles = getBrandProfiles();
  if (!profiles.some((p) => p.name === brand)) {
    profiles.push({
      name: brand,
      website: "",
      blog: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(BRANDS_KEY, JSON.stringify(profiles));
  }
}

export function removeBrand(brand: string) {
  const profiles = getBrandProfiles().filter((p) => p.name !== brand);
  localStorage.setItem(BRANDS_KEY, JSON.stringify(profiles));
}

export function getBrandProfile(name: string): BrandProfile | undefined {
  return getBrandProfiles().find((p) => p.name === name);
}

// Competitor Brands

export type SubscriptionTier = "free" | "tier1" | "tier2" | "tier3";

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  tier1: 3,
  tier2: 5,
  tier3: 10,
};

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  tier1: "Starter",
  tier2: "Pro",
  tier3: "Enterprise",
};

const COMPETITORS_KEY = "g304_competitors";
const TIER_KEY = "g304_tier";

export function getUserTier(): SubscriptionTier {
  if (typeof window === "undefined") return "free";
  return (localStorage.getItem(TIER_KEY) as SubscriptionTier) || "free";
}

export function setUserTier(tier: SubscriptionTier) {
  localStorage.setItem(TIER_KEY, tier);
}

export function getCompetitorProfiles(): BrandProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPETITORS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BrandProfile[];
  } catch {
    return [];
  }
}

export function getCompetitorNames(): string[] {
  return getCompetitorProfiles().map((b) => b.name);
}

export function saveCompetitorProfile(profile: BrandProfile) {
  const profiles = getCompetitorProfiles();
  const existing = profiles.findIndex((p) => p.name === profile.name);
  if (existing >= 0) {
    profiles[existing] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(profiles));
}

export function removeCompetitor(name: string) {
  const profiles = getCompetitorProfiles().filter((p) => p.name !== name);
  localStorage.setItem(COMPETITORS_KEY, JSON.stringify(profiles));
}
