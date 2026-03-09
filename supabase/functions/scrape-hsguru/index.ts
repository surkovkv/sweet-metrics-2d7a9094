import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HSGURU_URL =
  "https://www.hsguru.com/matchups?min_archetype_sample=500&min_matchup_sample=500&rank=legend";

// Map of class CSS classes to Hearthstone class names
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

function extractClassFromTh(thHtml: string): string {
  const match = thHtml.match(/class-background\s+(\w+)/);
  return match ? CLASS_MAP[match[1]] || "Unknown" : "Unknown";
}

function parseMatchupTable(html: string) {
  // Extract column headers (opponent archetype names) from first header row
  // Pattern: phx-value-sort_by="opponent_XXX"
  const headerRegex =
    /phx-value-sort_by="opponent_([^"]+)"/g;
  const opponentNames: string[] = [];
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    const name = match[1].trim();
    if (!opponentNames.includes(name)) {
      opponentNames.push(name);
    }
  }

  console.log(`Found ${opponentNames.length} opponent archetypes in headers`);

  // Extract class info from headers
  const headerClassRegex =
    /<th[^>]*class-background\s+(\w+)[^>]*>\s*<button[^>]*phx-value-sort_by="opponent_([^"]+)"[^>]*>/g;
  const archetypeClassMap: Record<string, string> = {};
  while ((match = headerClassRegex.exec(html)) !== null) {
    const cssClass = match[1];
    const archName = match[2].trim();
    archetypeClassMap[archName] = CLASS_MAP[cssClass] || "Unknown";
  }

  // Extract popularity percentages from 3rd header row
  // These are in the 3rd <tr> of <thead>, containing spans with "X.X%"
  const popularityValues: number[] = [];
  const theadMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  if (theadMatch) {
    const theadHtml = theadMatch[1];
    // Find the 3rd <tr> which contains popularity percentages
    const trMatches = theadHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
    if (trMatches && trMatches.length >= 3) {
      const popRow = trMatches[2]; // 3rd row (0-indexed)
      const popRegex =
        /<span[^>]*>(\d+\.?\d*)%<\/span>/g;
      let popMatch;
      while ((popMatch = popRegex.exec(popRow)) !== null) {
        popularityValues.push(parseFloat(popMatch[1]));
      }
    }
  }

  console.log(`Found ${popularityValues.length} popularity values`);

  // Extract tbody rows
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!tbodyMatch) {
    console.error("No tbody found in HTML");
    return { matchups: [], archetypeStats: [] };
  }

  const tbodyHtml = tbodyMatch[1];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const matchups: Array<{
    archetype: string;
    opponent_archetype: string;
    winrate: number;
    total_games: number | null;
  }> = [];
  const archetypeStats: Array<{
    archetype: string;
    winrate: number | null;
    popularity: number | null;
    total_games: number | null;
    hs_class: string;
  }> = [];

  let rowMatch;
  while ((rowMatch = rowRegex.exec(tbodyHtml)) !== null) {
    const rowHtml = rowMatch[1];

    // Extract all <td> cells
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1]);
    }

    if (cells.length < 3) continue;

    // First cell: overall winrate (e.g., "51.5%")
    const wrMatch = cells[0].match(/(\d+\.?\d*)%/);
    const overallWinrate = wrMatch ? parseFloat(wrMatch[1]) : null;

    // Second cell: archetype name and total games
    // Contains the archetype name as text, possibly with a link
    const nameMatch = cells[1].match(
      /(?:<a[^>]*>)?\s*([^<]+?)\s*(?:<\/a>)?(?:.*?(\d[\d,]*))?/
    );
    let archetypeName = "";
    let totalGames: number | null = null;

    // Try to extract archetype name more robustly
    const linkMatch = cells[1].match(/<a[^>]*>\s*([^<]+)\s*<\/a>/);
    if (linkMatch) {
      archetypeName = linkMatch[1].trim();
    } else {
      // Try plain text
      const plainMatch = cells[1].replace(/<[^>]*>/g, "").trim();
      if (plainMatch) {
        // The cell might have "ArchetypeName\n12345" format
        const parts = plainMatch.split(/\s+/);
        // Find where the number starts
        const numIdx = parts.findIndex((p) => /^\d[\d,]*$/.test(p));
        if (numIdx > 0) {
          archetypeName = parts.slice(0, numIdx).join(" ");
          totalGames = parseInt(parts[numIdx].replace(/,/g, ""));
        } else {
          archetypeName = plainMatch;
        }
      }
    }

    // Try to extract total games from the cell
    const gamesMatch = cells[1].match(/(\d[\d,]+)/g);
    if (gamesMatch && gamesMatch.length > 0) {
      const lastNum = gamesMatch[gamesMatch.length - 1].replace(/,/g, "");
      const parsed = parseInt(lastNum);
      if (parsed > 100) totalGames = parsed;
    }

    if (!archetypeName) continue;

    // Determine HS class from the archetype class map
    const hsClass = archetypeClassMap[archetypeName] || "Unknown";

    // Calculate popularity from total games
    const totalGamesAll = 676578; // From the page "Seed Weights" button
    const popularity =
      totalGames !== null
        ? Math.round((totalGames / totalGamesAll) * 1000) / 10
        : null;

    archetypeStats.push({
      archetype: archetypeName,
      winrate: overallWinrate,
      popularity,
      total_games: totalGames,
      hs_class: hsClass,
    });

    // Remaining cells are matchup winrates, one per opponent
    for (let i = 2; i < cells.length && i - 2 < opponentNames.length; i++) {
      const cellText = cells[i].replace(/<[^>]*>/g, "").trim();
      const cellWrMatch = cellText.match(/(\d+\.?\d*)%?/);
      if (cellWrMatch) {
        const wr = parseFloat(cellWrMatch[1]);
        if (wr >= 0 && wr <= 100) {
          matchups.push({
            archetype: archetypeName,
            opponent_archetype: opponentNames[i - 2],
            winrate: wr,
            total_games: null,
          });
        }
      }
    }
  }

  // Update popularity from header row if we have it
  if (popularityValues.length === opponentNames.length) {
    for (let i = 0; i < opponentNames.length; i++) {
      const stat = archetypeStats.find((s) => s.archetype === opponentNames[i]);
      if (stat && stat.popularity === null) {
        stat.popularity = popularityValues[i];
      }
    }
  }

  console.log(
    `Parsed ${archetypeStats.length} archetypes and ${matchups.length} matchups`
  );
  return { matchups, archetypeStats };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Firecrawl connector not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Scraping HSGuru matchups page via Firecrawl...");

    // Use Firecrawl to render the page (Phoenix LiveView needs JS execution)
    const firecrawlResponse = await fetch(
      "https://api.firecrawl.dev/v1/scrape",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: HSGURU_URL,
          formats: ["html"],
          waitFor: 8000, // Wait 8s for LiveView to render the table
          onlyMainContent: false,
        }),
      }
    );

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error("Firecrawl error:", firecrawlData);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Firecrawl error: ${firecrawlData.error || firecrawlResponse.status}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get HTML from response (handle nested data structure)
    const html = firecrawlData.data?.html || firecrawlData.html;
    if (!html) {
      console.error("No HTML in Firecrawl response:", Object.keys(firecrawlData));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Firecrawl returned no HTML content",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Got ${html.length} chars of HTML`);

    // Parse the matchup table
    const { matchups, archetypeStats } = parseMatchupTable(html);

    if (matchups.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "No matchup data found in HTML. The page might not have loaded fully.",
          htmlLength: html.length,
          hasTbody: html.includes("<tbody"),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Delete old data for today
    await supabase.from("matchups").delete().eq("date", today);
    await supabase.from("archetype_stats").delete().eq("date", today);

    // Insert matchups in batches of 500
    const matchupsWithDate = matchups.map((m) => ({ ...m, date: today }));
    for (let i = 0; i < matchupsWithDate.length; i += 500) {
      const batch = matchupsWithDate.slice(i, i + 500);
      const { error } = await supabase.from("matchups").insert(batch);
      if (error) {
        console.error("Matchup insert error:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: `DB insert error: ${error.message}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Insert archetype stats
    const statsWithDate = archetypeStats.map((s) => ({ ...s, date: today }));
    const { error: statsError } = await supabase
      .from("archetype_stats")
      .insert(statsWithDate);
    if (statsError) {
      console.error("Stats insert error:", statsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        matchupsCount: matchups.length,
        archetypesCount: archetypeStats.length,
        archetypes: archetypeStats.map((a) => a.archetype),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
