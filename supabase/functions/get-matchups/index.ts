import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the latest date that has data
    const { data: latestDate } = await supabase
      .from("matchups")
      .select("date")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (!latestDate) {
      return new Response(
        JSON.stringify({ success: true, matchups: [], archetypeStats: [], date: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const date = latestDate.date;

    // Fetch matchups and stats for that date
    const [matchupsRes, statsRes] = await Promise.all([
      supabase.from("matchups").select("*").eq("date", date),
      supabase.from("archetype_stats").select("*").eq("date", date),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        date,
        matchups: matchupsRes.data || [],
        archetypeStats: statsRes.data || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
