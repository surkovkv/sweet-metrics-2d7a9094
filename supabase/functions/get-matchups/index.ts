import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    let rank = url.searchParams.get("rank") || "all";
    let period = url.searchParams.get("period") || null;

    // Try body for invoke() calls
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.rank) rank = body.rank;
        if (body?.period) period = body.period;
      } catch { /* ignore */ }
    }

    if (!["all", "legend", "diamond_to_legend", "top_1k", "top_5k"].includes(rank)) rank = "all";

    // Find the latest date+period with data for this rank
    let q = supabase
      .from("matchups")
      .select("date, period")
      .eq("rank", rank)
      .order("date", { ascending: false })
      .limit(1);
    if (period) q = q.eq("period", period);

    const { data: latest, error: latestErr } = await q.maybeSingle();
    if (latestErr) throw latestErr;

    if (!latest) {
      return new Response(
        JSON.stringify({
          success: true,
          matchups: [],
          archetypeStats: [],
          date: null,
          rank,
          period: period || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const date = latest.date;
    const resolvedPeriod = latest.period;

    // Paginate matchups — Supabase default limit is 1000, can have 3000+ rows per rank
    async function fetchAllMatchups() {
      const pageSize = 1000;
      let from = 0;
      const all: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("matchups")
          .select("*")
          .eq("date", date)
          .eq("rank", rank)
          .eq("period", resolvedPeriod)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    }

    const [matchupsData, statsRes] = await Promise.all([
      fetchAllMatchups(),
      supabase
        .from("archetype_stats")
        .select("*")
        .eq("date", date)
        .eq("rank", rank)
        .eq("period", resolvedPeriod),
    ]);
    const matchupsRes = { data: matchupsData };

    return new Response(
      JSON.stringify({
        success: true,
        date,
        rank,
        period: resolvedPeriod,
        matchups: matchupsRes.data || [],
        archetypeStats: statsRes.data || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
