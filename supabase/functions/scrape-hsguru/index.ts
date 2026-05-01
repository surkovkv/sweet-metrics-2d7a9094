import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// HSGuru scraper — fetches all combinations of (rank × period) and rebuilds the DB.
// Periods correspond to HSGuru's `period` query param values.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const RANKS: Array<{ db: string; hsguru: string }> = [
  { db: "all", hsguru: "all" },
  { db: "legend", hsguru: "legend" },
  { db: "top_1k", hsguru: "top_legend" },
];

// Periods we fetch. `current` = no `period` param (HSGuru default = current patch).
const PERIODS: Array<{ db: string; hsguru: string | null }> = [
  { db: "current", hsguru: null },
  { db: "past_3_days", hsguru: "past_3_days" },
  { db: "past_week", hsguru: "past_week" },
  { db: "past_month", hsguru: "past_month" },
];

function buildUrl(rankHsguru: string, periodHsguru: string | null) {
  const params = new URLSearchParams({
    min_archetype_sample: "1",
    min_matchup_sample: "1",
    rank: rankHsguru,
  });
  if (periodHsguru) params.set("period", periodHsguru);
  return `https://www.hsguru.com/matchups?${params.toString()}`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

interface ParsedArchetype {
  name: string;
  hsClass: string;
  winrate: number | null;
  popularity: number | null;
  totalGames: number | null;
}
interface ParsedMatchup {
  archetype: string;
  opponent: string;
  winrate: number;
  estimatedGames: number | null;
}

function parseMatchupTable(html: string): {
  archetypes: ParsedArchetype[];
  matchups: ParsedMatchup[];
} {
  // 1. Opponent column archetypes + classes, in table order
  const thOpponentRe =
    /<th[^>]*class-background\s+([a-z]+)[^>]*>[\s\S]*?phx-value-sort_by="opponent_([^"]+)"/g;
  const opponentOrder: string[] = [];
  const opponentClass: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = thOpponentRe.exec(html)) !== null) {
    const cssClass = m[1];
    const name = m[2].trim();
    if (!opponentOrder.includes(name)) {
      opponentOrder.push(name);
      opponentClass[name] = CLASS_MAP[cssClass] || "Unknown";
    }
  }

  // 2. Popularity row
  const theadM = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  const popByIndex: number[] = [];
  if (theadM) {
    const trs = theadM[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    for (let i = trs.length - 1; i >= 0; i--) {
      const tr = trs[i];
      if (tr.includes("<button") || tr.includes("<form") || tr.includes("<input")) continue;
      const pops = [...tr.matchAll(/<span[^>]*>\s*([\d.]+)%\s*<\/span>/g)].map((x) =>
        parseFloat(x[1]),
      );
      if (pops.length > 0) {
        popByIndex.push(...pops);
        break;
      }
    }
  }

  // 3. Body rows
  const tbodyM = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbodyM) {
    return { archetypes: [], matchups: [] };
  }

  const archetypes: ParsedArchetype[] = [];
  const matchups: ParsedMatchup[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowM: RegExpExecArray | null;
  while ((rowM = rowRe.exec(tbodyM[1])) !== null) {
    const row = rowM[1];

    const firstTdRe =
      /<td[^>]*aria-label="([^"]+?)\s-\s([\d,]+)\s+games?"[^>]*>([\s\S]*?)<\/td>/;
    const firstTd = row.match(firstTdRe);
    if (!firstTd) continue;
    const archetypeName = firstTd[1].trim();
    const totalGames = parseInt(firstTd[2].replace(/,/g, ""));
    const wrSpan = firstTd[3].match(/<span[^>]*>\s*([\d.]+)\s*<\/span>/);
    const overallWr = wrSpan ? parseFloat(wrSpan[1]) : null;

    const classTd = row.match(
      /<td[^>]*class="[^"]*sticky-column[^"]*class-background\s+([a-z]+)[^"]*"/,
    );
    const hsClass = classTd ? CLASS_MAP[classTd[1]] || "Unknown" : "Unknown";

    archetypes.push({
      name: archetypeName,
      hsClass,
      winrate: overallWr !== null ? round1(overallWr) : null,
      popularity: null,
      totalGames,
    });

    const mupRe =
      /<td[^>]*aria-label="([^"]+?)\s+versus\s+([^"]+?)\s-\s([\d,]+)\s+games?"[^>]*>[\s\S]*?<span[^>]*>\s*([\d.]+)\s*<\/span>[\s\S]*?<\/td>/g;
    let mupM: RegExpExecArray | null;
    while ((mupM = mupRe.exec(row)) !== null) {
      const a = mupM[1].trim();
      const b = mupM[2].trim();
      const games = parseInt(mupM[3].replace(/,/g, ""));
      const wr = parseFloat(mupM[4]);
      if (a !== archetypeName) continue;
      if (!Number.isFinite(wr) || wr < 0 || wr > 100) continue;
      matchups.push({
        archetype: a,
        opponent: b,
        winrate: round1(wr),
        estimatedGames: Number.isFinite(games) ? games : null,
      });
    }
  }

  if (popByIndex.length > 0) {
    for (let i = 0; i < opponentOrder.length && i < popByIndex.length; i++) {
      const name = opponentOrder[i];
      const arch = archetypes.find((a) => a.name === name);
      if (arch) arch.popularity = round1(popByIndex[i]);
    }
  }

  for (const a of archetypes) {
    if (a.hsClass === "Unknown" && opponentClass[a.name]) a.hsClass = opponentClass[a.name];
  }

  return { archetypes, matchups };
}

async function scrapeOne(apiKey: string, rankHsguru: string, periodHsguru: string | null) {
  const url = buildUrl(rankHsguru, periodHsguru);
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
      waitFor: 5000,
      timeout: 45000,
      onlyMainContent: false,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Firecrawl failed (${res.status}): ${data?.error || "unknown"}`);
  }
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

    const today = new Date().toISOString().split("T")[0];

    // 1. Scrape all rank × period combinations IN PARALLEL to stay within
    // the edge-function wall-clock budget (~150s). Firecrawl handles 12
    // concurrent jobs comfortably; if any single scrape fails we just
    // record an empty bucket and keep going.
    type ScrapeResult = { archetypes: ParsedArchetype[]; matchups: ParsedMatchup[] };
    const scraped: Record<string, Record<string, ScrapeResult>> = {};
    for (const { db: rDb } of RANKS) scraped[rDb] = {};

    const jobs = RANKS.flatMap(({ db: rDb, hsguru: rHs }) =>
      PERIODS.map(({ db: pDb, hsguru: pHs }) => ({ rDb, rHs, pDb, pHs })),
    );

    await Promise.all(
      jobs.map(async ({ rDb, rHs, pDb, pHs }) => {
        try {
          const parsed = await scrapeOne(apiKey, rHs, pHs);
          console.log(
            `rank=${rDb} period=${pDb}: archetypes=${parsed.archetypes.length}, matchups=${parsed.matchups.length}`,
          );
          scraped[rDb][pDb] = parsed;
        } catch (err) {
          console.error(`rank=${rDb} period=${pDb} scrape failed:`, err);
          scraped[rDb][pDb] = { archetypes: [], matchups: [] };
        }
      }),
    );

    // Sanity: at least the primary "all/current" must succeed
    const primary = scraped.all?.current;
    if (!primary || primary.archetypes.length === 0 || primary.matchups.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Primary scrape (rank=all, period=current) returned no data. DB not modified.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Wipe existing data
    const { error: delM } = await supabase.from("matchups").delete().gte("date", "1900-01-01");
    if (delM) throw new Error(`wipe matchups: ${delM.message}`);
    const { error: delS } = await supabase
      .from("archetype_stats")
      .delete()
      .gte("date", "1900-01-01");
    if (delS) throw new Error(`wipe stats: ${delS.message}`);

    // 3. Insert fresh data per (rank, period)
    const summary: Array<{
      rank: string;
      period: string;
      archetypes: number;
      matchups: number;
    }> = [];

    for (const { db: rDb } of RANKS) {
      for (const { db: pDb } of PERIODS) {
        const parsed = scraped[rDb][pDb];
        if (!parsed || parsed.archetypes.length === 0) {
          summary.push({ rank: rDb, period: pDb, archetypes: 0, matchups: 0 });
          continue;
        }

        const statRows = parsed.archetypes.map((a) => ({
          name: a.name,
          winrate: a.winrate,
          popularity: a.popularity,
          total_games: a.totalGames,
          hs_class: a.hsClass,
          date: today,
          rank: rDb,
          period: pDb,
        }));
        const { error: sErr } = await supabase.from("archetype_stats").insert(statRows);
        if (sErr) throw new Error(`stats insert [${rDb}/${pDb}]: ${sErr.message}`);

        const mupRows = parsed.matchups.map((x) => ({
          archetype: x.archetype,
          opponent: x.opponent,
          winrate: x.winrate,
          estimated_games: x.estimatedGames,
          date: today,
          rank: rDb,
          period: pDb,
        }));
        for (let i = 0; i < mupRows.length; i += 500) {
          const batch = mupRows.slice(i, i + 500);
          const { error: mErr } = await supabase.from("matchups").insert(batch);
          if (mErr) throw new Error(`matchups insert [${rDb}/${pDb}]: ${mErr.message}`);
        }

        summary.push({
          rank: rDb,
          period: pDb,
          archetypes: parsed.archetypes.length,
          matchups: parsed.matchups.length,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, date: today, summary }),
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
