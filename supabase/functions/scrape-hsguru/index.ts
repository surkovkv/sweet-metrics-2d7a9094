import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Current patch period used on hsguru — change when a new patch drops
const DEFAULT_PERIOD = "patch_35.0.3";

const CLASS_MAP: Record<string, string> = {
  deathknight: "Death Knight",
  demonhunter: "Demon Hunter",
  druid: "Druid",
  hunter: "Hunter",
  mage: "Mage",
  paladin: "Paladin",
  priest: "Priest",
  rogue: "Rogue",
  shaman: "Shaman",
  warlock: "Warlock",
  warrior: "Warrior",
  unknown: "Unknown",
};

// rank values stored in DB and expected by client filters
// "all" | "legend" | "top_1k"  (top_1k = hsguru "top_legend")
const RANKS: Array<{ db: string; hsguru: string }> = [
  { db: "all", hsguru: "all" },
  { db: "legend", hsguru: "legend" },
  { db: "top_1k", hsguru: "top_legend" },
];

function buildUrl(rankHsguru: string, period: string) {
  const params = new URLSearchParams({
    min_archetype_sample: "1",
    min_matchup_sample: "1",
    rank: rankHsguru,
    period,
  });
  return `https://www.hsguru.com/matchups?${params.toString()}`;
}

function parseMatchupTable(html: string) {
  // Opponent archetype names from header buttons
  const headerRegex = /phx-value-sort_by="opponent_([^"]+)"/g;
  const opponentNames: string[] = [];
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    const name = match[1].trim();
    if (!opponentNames.includes(name)) opponentNames.push(name);
  }

  // Map archetype -> hsClass
  const headerClassRegex =
    /<th[^>]*class-background\s+(\w+)[^>]*>\s*<button[^>]*phx-value-sort_by="opponent_([^"]+)"[^>]*>/g;
  const archetypeClassMap: Record<string, string> = {};
  while ((match = headerClassRegex.exec(html)) !== null) {
    const cssClass = match[1];
    const archName = match[2].trim();
    archetypeClassMap[archName] = CLASS_MAP[cssClass] || "Unknown";
  }

  // Popularity values from 3rd header row
  const popularityValues: number[] = [];
  const theadMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  if (theadMatch) {
    const trMatches = theadMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
    if (trMatches && trMatches.length >= 3) {
      const popRow = trMatches[2];
      const popRegex = /<span[^>]*>(\d+\.?\d*)%<\/span>/g;
      let popMatch;
      while ((popMatch = popRegex.exec(popRow)) !== null) {
        popularityValues.push(parseFloat(popMatch[1]));
      }
    }
  }

  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) return { matchups: [], archetypeStats: [] };

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const matchups: Array<{
    archetype: string;
    opponent: string;
    winrate: number;
    estimated_games: number | null;
  }> = [];
  const archetypeStats: Array<{
    name: string;
    winrate: number | null;
    popularity: number | null;
    total_games: number | null;
    hs_class: string | null;
  }> = [];

  let rowMatch;
  const tbodyHtml = tbodyMatch[1];
  while ((rowMatch = rowRegex.exec(tbodyHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) cells.push(tdMatch[1]);
    if (cells.length < 3) continue;

    // Cell 0: overall winrate
    const cell0Text = cells[0].replace(/<[^>]*>/g, "").trim();
    const providedWrMatch = cell0Text.match(/(\d+\.?\d*)/);
    const providedWinrate = providedWrMatch ? parseFloat(providedWrMatch[1]) : null;

    // Compute avg from row if provided is missing
    let totalWR = 0;
    let wrCount = 0;
    for (let i = 2; i < cells.length && i - 2 < opponentNames.length; i++) {
      const t = cells[i].replace(/<[^>]*>/g, "").trim();
      const m = t.match(/(\d+\.?\d*)%?/);
      if (m) {
        const wr = parseFloat(m[1]);
        if (wr >= 0 && wr <= 100) {
          totalWR += wr;
          wrCount++;
        }
      }
    }
    const overallWinrate =
      providedWinrate !== null
        ? providedWinrate
        : wrCount > 0
        ? Math.round((totalWR / wrCount) * 10) / 10
        : null;

    // Cell 1: archetype name + total games
    let archetypeName = "";
    let totalGames: number | null = null;
    const linkMatch = cells[1].match(/<a[^>]*>\s*([^<]+)\s*<\/a>/);
    if (linkMatch) archetypeName = linkMatch[1].trim();
    else {
      const plain = cells[1].replace(/<[^>]*>/g, "").trim();
      const parts = plain.split(/\s+/);
      const numIdx = parts.findIndex((p) => /^\d[\d,]*$/.test(p));
      if (numIdx > 0) {
        archetypeName = parts.slice(0, numIdx).join(" ");
        totalGames = parseInt(parts[numIdx].replace(/,/g, ""));
      } else archetypeName = plain;
    }
    const allNums = cells[1].match(/(\d[\d,]+)/g);
    if (allNums && allNums.length > 0) {
      const last = parseInt(allNums[allNums.length - 1].replace(/,/g, ""));
      if (last > 50) totalGames = last;
    }
    if (!archetypeName) continue;

    const hsClass = archetypeClassMap[archetypeName] || "Unknown";

    archetypeStats.push({
      name: archetypeName,
      winrate: overallWinrate,
      popularity: null,
      total_games: totalGames,
      hs_class: hsClass,
    });

    // Matchup cells
    for (let i = 2; i < cells.length && i - 2 < opponentNames.length; i++) {
      const cellText = cells[i].replace(/<[^>]*>/g, "").trim();
      let wr: number | null = null;
      let estGames: number | null = null;
      const wrMatch = cellText.match(/^(\d+\.?\d*)%?/);
      if (wrMatch) {
        wr = parseFloat(wrMatch[1]);
        const remaining = cellText.slice(wrMatch[0].length).trim();
        if (remaining) {
          const gm = remaining.match(/(\d[\d,]*)/);
          if (gm) estGames = parseInt(gm[1].replace(/,/g, ""));
        }
      }
      if (wr !== null && wr >= 0 && wr <= 100) {
        matchups.push({
          archetype: archetypeName,
          opponent: opponentNames[i - 2],
          winrate: Math.round(wr * 10) / 10,
          estimated_games: estGames,
        });
      }
    }
  }

  if (popularityValues.length === opponentNames.length) {
    for (let i = 0; i < opponentNames.length; i++) {
      const stat = archetypeStats.find((s) => s.name === opponentNames[i]);
      if (stat) stat.popularity = popularityValues[i];
    }
  }

  return { matchups, archetypeStats };
}

async function scrapeOneRank(
  apiKey: string,
  rankHsguru: string,
  period: string,
) {
  const url = buildUrl(rankHsguru, period);
  console.log(`Scraping ${url}`);
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["html"],
      waitFor: 8000,
      onlyMainContent: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firecrawl: ${data.error || res.status}`);
  const html = data.data?.html || data.html;
  if (!html) throw new Error("Firecrawl returned no HTML");
  return parseMatchupTable(html);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: { period?: string } = {};
    try {
      if (req.method === "POST") body = await req.json();
    } catch { /* ignore */ }
    const period = body.period || DEFAULT_PERIOD;
    const today = new Date().toISOString().split("T")[0];

    // Clear today's rows for this period so we re-insert fresh data
    await supabase.from("matchups").delete().eq("date", today).eq("period", period);
    await supabase.from("archetype_stats").delete().eq("date", today).eq("period", period);

    const summary: Array<{ rank: string; archetypes: number; matchups: number }> = [];

    for (const { db: rankDb, hsguru: rankHs } of RANKS) {
      try {
        const { matchups, archetypeStats } = await scrapeOneRank(apiKey, rankHs, period);

        if (matchups.length === 0) {
          console.warn(`No matchups for rank=${rankDb}`);
          summary.push({ rank: rankDb, archetypes: 0, matchups: 0 });
          continue;
        }

        const mRows = matchups.map((m) => ({
          ...m,
          date: today,
          rank: rankDb,
          period,
        }));
        for (let i = 0; i < mRows.length; i += 500) {
          const batch = mRows.slice(i, i + 500);
          const { error } = await supabase.from("matchups").insert(batch);
          if (error) throw new Error(`matchups insert [${rankDb}]: ${error.message}`);
        }

        const sRows = archetypeStats.map((s) => ({
          ...s,
          date: today,
          rank: rankDb,
          period,
        }));
        const { error: sErr } = await supabase.from("archetype_stats").insert(sRows);
        if (sErr) throw new Error(`stats insert [${rankDb}]: ${sErr.message}`);

        summary.push({
          rank: rankDb,
          archetypes: archetypeStats.length,
          matchups: matchups.length,
        });
      } catch (err) {
        console.error(`rank=${rankDb} failed:`, err);
        summary.push({
          rank: rankDb,
          archetypes: 0,
          matchups: 0,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, date: today, period, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
