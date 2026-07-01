import { getSupabase, backendConfigured } from "@/lib/server/db";
import { analyzeBrandVisibility, type ScanEvent, type BrandContext } from "@/lib/server/ai";
import { assembleBrandData, type BrandData } from "@/lib/brand-data";

function shortLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Runs a real scan for a brand and (when the backend is configured) grounds it
// in the brand's identity + real scan history: looks up the brand's website/
// socials for disambiguation, records the run in scan_history, and builds the
// trend + week-over-week deltas from actual past scans. Stores the result in
// `scans` and returns it.
export async function runScanAndStore(
  userId: string,
  brand: string,
  onEvent: (e: ScanEvent) => void = () => {}
): Promise<BrandData> {
  const scannedAt = new Date().toISOString();

  if (!backendConfigured) {
    const { core, responses } = await analyzeBrandVisibility(brand, onEvent);
    return assembleBrandData(core, { engineResponses: responses, scannedAt });
  }

  const sb = getSupabase();

  // Identity for disambiguation (same-named entities).
  let ctx: BrandContext | undefined;
  const { data: prof } = await sb
    .from("brands")
    .select("website, twitter, blog, instagram, linkedin")
    .eq("user_id", userId)
    .eq("name", brand)
    .limit(1)
    .maybeSingle();
  if (prof)
    ctx = {
      website: prof.website || undefined,
      twitter: prof.twitter || undefined,
      blog: prof.blog || undefined,
      instagram: prof.instagram || undefined,
      linkedin: prof.linkedin || undefined,
    };

  const { core, responses } = await analyzeBrandVisibility(brand, onEvent, ctx);

  // Real deltas + trend from scan_history. Wrapped so a missing table (schema
  // not applied yet) degrades gracefully instead of failing the scan.
  let prev: { brandScore: number; soa: number; accuracy: number; citation: number } | undefined;
  let soaHistory: { label: string; soa: number; accuracy: number }[] = [];
  try {
    const { data: prevRows } = await sb
      .from("scan_history")
      .select("brand_score, soa, accuracy, citation")
      .eq("user_id", userId)
      .eq("brand_name", brand)
      .order("created_at", { ascending: false })
      .limit(1);
    const p = prevRows?.[0];
    if (p) prev = { brandScore: p.brand_score, soa: p.soa, accuracy: p.accuracy, citation: p.citation };

    await sb.from("scan_history").insert({
      user_id: userId,
      brand_name: brand,
      brand_score: core.brandScore,
      soa: core.soa,
      accuracy: core.accuracy,
      citation: core.citation,
      created_at: scannedAt,
    });

    const { data: hist } = await sb
      .from("scan_history")
      .select("soa, accuracy, created_at")
      .eq("user_id", userId)
      .eq("brand_name", brand)
      .order("created_at", { ascending: true })
      .limit(30);
    soaHistory = (hist ?? []).slice(-8).map((h) => ({ label: shortLabel(h.created_at), soa: h.soa, accuracy: h.accuracy }));
  } catch {
    /* scan_history not available — scan still works without trend/deltas */
  }

  const data = assembleBrandData(core, { engineResponses: responses, scannedAt, soaHistory, prev });

  await sb
    .from("scans")
    .upsert(
      { user_id: userId, brand_name: brand, engine: "claude", data, created_at: scannedAt },
      { onConflict: "user_id,brand_name" }
    );

  return data;
}
