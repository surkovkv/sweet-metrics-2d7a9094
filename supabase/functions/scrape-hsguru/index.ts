import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Fresh HSGuru scraper — rebuilt from scratch.
// Parses the real HSGuru matchup table structure, extracting:
// - archetype list + class (from header buttons `opponent_<name>` + `class-background <css>`)
// - popularity (from 3rd row of thead, "<pct>%")
// - per-archetype total_games (from row cells' `aria-label="<Archetype> - <N> games"`)
// - per-matchup winrate + estimated_games (from cells' `aria-label="A versus B - <N> games"` + inner `<span>NN.N</span>`)
// - overall winrate (from first td of each row, which shows avg WR as `<span>NN.N</span>`)

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

// rank values stored in DB and expected by client filters
// "all" | "legend" | "top_1k"  (top_1k = hsguru "top_legend")
const RANKS: Array<{ db: string; hsguru: string }> = [
  { db: "all", hsguru: "all" },
  { db: "legend", hsguru: "legend" },
  { db: "top_1k", hsguru: "top_legend" },
];

function buildUrl(rankHsguru: string) {
  const params = new URLSearchParams({
    min_archetype_sample: "1",
    min_matchup_sample: "1",
    rank: rankHsguru,
  });
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
  detectedPeriod: string | null;
} {
  // Detect active patch/period link (first ".selected" item in period dropdown if any)
  let detectedPeriod: string | null = null;
  const periodRe = /href="\/matchups\?[^"]*period=([^"&]+)[^"]*"[^>]*class="[^"]*is-active[^"]*"/i;
  const pMatch = html.match(periodRe);
  if (pMatch) detectedPeriod = pMatch[1];

  // 1. Opponent column archetypes + classes, in table order
  // <th class="... class-background <cssClass>"> ... phx-value-sort_by="opponent_<Name>"
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

  // 2. Popularity row (3rd <tr> of <thead>) — sequence of "<span>...NN.N%</span>"
  const theadM = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  const popByIndex: number[] = [];
  if (theadM) {
    const trs = theadM[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
    // Popularity row is the last <tr> in thead that is NOT the header (archetype names) row.
    // Structure: row1 = winrate/archetype + opponent name headers, row2 = custom popularity form inputs, row3 = popularity %.
    // Safer: pick the last <tr> that contains only "<span>NN.N%</span>" cells (no <button> / <form> / <input>).
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
    return { archetypes: [], matchups: [], detectedPeriod };
  }

  const archetypes: ParsedArchetype[] = [];
  const matchups: ParsedMatchup[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let rowM: RegExpExecArray | null;
  while ((rowM = rowRe.exec(tbodyM[1])) !== null) {
    const row = rowM[1];

    // Row archetype name + total games: first <td> with aria-label "<Name> - <N> games"
    const firstTdRe =
      /<td[^>]*aria-label="([^"]+?)\s-\s([\d,]+)\s+games?"[^>]*>([\s\S]*?)<\/td>/;
    const firstTd = row.match(firstTdRe);
    if (!firstTd) continue;
    const archetypeName = firstTd[1].trim();
    const totalGames = parseInt(firstTd[2].replace(/,/g, ""));
    const wrSpan = firstTd[3].match(/<span[^>]*>\s*([\d.]+)\s*<\/span>/);
    const overallWr = wrSpan ? parseFloat(wrSpan[1]) : null;

    // Class of archetype = class from the sticky-column td (class-background <class>)
    const classTd = row.match(
      /<td[^>]*class="[^"]*sticky-column[^"]*class-background\s+([a-z]+)[^"]*"/,
    );
    const hsClass = classTd ? CLASS_MAP[classTd[1]] || "Unknown" : "Unknown";

    archetypes.push({
      name: archetypeName,
      hsClass,
      winrate: overallWr !== null ? round1(overallWr) : null,
      popularity: null, // filled below
      totalGames,
    });

    // Matchup cells: every <td aria-label="A versus B - N games"> ... <span>NN.N</span>
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

  // Attach popularity by opponent order
  if (popByIndex.length > 0) {
    for (let i = 0; i < opponentOrder.length && i < popByIndex.length; i++) {
      const name = opponentOrder[i];
      const arch = archetypes.find((a) => a.name === name);
      if (arch) arch.popularity = round1(popByIndex[i]);
    }
  }

  // Also make sure hsClass is set from opponentClass for any archetype we know via header
  for (const a of archetypes) {
    if (a.hsClass === "Unknown" && opponentClass[a.name]) a.hsClass = opponentClass[a.name];
  }

  return { archetypes, matchups, detectedPeriod };
}

async function scrapeOneRank(apiKey: string, rankHsguru: string) {
  const url = buildUrl(rankHsguru);
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

    // 1. Scrape all ranks FIRST (no DB writes yet). If "all" fails, abort.
    const scraped: Record<
      string,
      { archetypes: ParsedArchetype[]; matchups: ParsedMatchup[]; detectedPeriod: string | null }
    > = {};

    for (const { db, hsguru } of RANKS) {
      try {
        const parsed = await scrapeOneRank(apiKey, hsguru);
        console.log(
          `rank=${db}: archetypes=${parsed.archetypes.length}, matchups=${parsed.matchups.length}, period=${parsed.detectedPeriod}`,
        );
        scraped[db] = parsed;
      } catch (err) {
        console.error(`rank=${db} scrape failed:`, err);
        scraped[db] = { archetypes: [], matchups: [], detectedPeriod: null };
      }
    }

    if (!scraped.all || scraped.all.archetypes.length === 0 || scraped.all.matchups.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Primary scrape (rank=all) returned no data. DB not modified.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve period from the "all" scrape (fallback to "current")
    const period = scraped.all.detectedPeriod || "current";

    // 2. WIPE old data entirely (full reset) — user asked to rebuild from scratch.
    const { error: delM } = await supabase.from("matchups").delete().gte("date", "1900-01-01");
    if (delM) throw new Error(`wipe matchups: ${delM.message}`);
    const { error: delS } = await supabase
      .from("archetype_stats")
      .delete()
      .gte("date", "1900-01-01");
    if (delS) throw new Error(`wipe stats: ${delS.message}`);

    // 3. Insert fresh rows for all ranks that returned data.
    const summary: Array<{
      rank: string;
      archetypes: number;
      matchups: number;
      matchupsWithGames: number;
      archetypesWithGames: number;
    }> = [];

    for (const { db } of RANKS) {
      const parsed = scraped[db];
      if (!parsed || parsed.archetypes.length === 0) {
        summary.push({
          rank: db,
          archetypes: 0,
          matchups: 0,
          matchupsWithGames: 0,
          archetypesWithGames: 0,
        });
        continue;
      }

      const statRows = parsed.archetypes.map((a) => ({
        name: a.name,
        winrate: a.winrate,
        popularity: a.popularity,
        total_games: a.totalGames,
        hs_class: a.hsClass,
        date: today,
        rank: db,
        period,
      }));
      const { error: sErr } = await supabase.from("archetype_stats").insert(statRows);
      if (sErr) throw new Error(`stats insert [${db}]: ${sErr.message}`);

      const mupRows = parsed.matchups.map((x) => ({
        archetype: x.archetype,
        opponent: x.opponent,
        winrate: x.winrate,
        estimated_games: x.estimatedGames,
        date: today,
        rank: db,
        period,
      }));
      for (let i = 0; i < mupRows.length; i += 500) {
        const batch = mupRows.slice(i, i + 500);
        const { error: mErr } = await supabase.from("matchups").insert(batch);
        if (mErr) throw new Error(`matchups insert [${db}]: ${mErr.message}`);
      }

      summary.push({
        rank: db,
        archetypes: parsed.archetypes.length,
        matchups: parsed.matchups.length,
        matchupsWithGames: parsed.matchups.filter((x) => x.estimatedGames != null).length,
        archetypesWithGames: parsed.archetypes.filter((a) => a.totalGames != null).length,
      });
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
