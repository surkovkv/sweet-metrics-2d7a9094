import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { archetypes, matchupSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a top-tier Hearthstone meta analyst. You analyze meta data from Legend rank and provide actionable insights for competitive ladder play. Be concise, data-driven, and specific. Respond in the same language as the user's input data.`;

    const userPrompt = `Analyze the current Hearthstone meta (Legend rank data):

ARCHETYPES (sorted by popularity):
${(archetypes || []).map((a: any) => `- ${a.name} (${a.hsClass}): ${a.winrate}% WR, ${a.popularity}% popularity`).join("\n")}

KEY MATCHUPS:
${matchupSummary || "No detailed matchup data available"}

Provide your analysis with:
1. Top 5 best decks for climbing the ranked ladder, with brief reasoning for each
2. An assessment of the current meta health (diversity, balance, dominance)
3. One practical counter-meta tip for players looking to exploit the current meta`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "meta_analysis",
                description:
                  "Return structured meta analysis results",
                parameters: {
                  type: "object",
                  properties: {
                    top5: {
                      type: "array",
                      description: "Top 5 decks for ranked ladder",
                      items: {
                        type: "object",
                        properties: {
                          rank: {
                            type: "number",
                            description: "Ranking position 1-5",
                          },
                          name: {
                            type: "string",
                            description: "Archetype name exactly as provided",
                          },
                          winrate: {
                            type: "number",
                            description: "Winrate percentage",
                          },
                          reason: {
                            type: "string",
                            description:
                              "Brief 1-2 sentence reason why this deck is recommended",
                          },
                        },
                        required: ["rank", "name", "winrate", "reason"],
                        additionalProperties: false,
                      },
                    },
                    metaHealth: {
                      type: "string",
                      description:
                        "2-3 sentence assessment of the current meta health",
                    },
                    counterMetaTip: {
                      type: "string",
                      description:
                        "One practical counter-meta tip, 1-2 sentences",
                    },
                  },
                  required: ["top5", "metaHealth", "counterMetaTip"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "meta_analysis" },
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Payment required. Please add funds to your workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ success: true, analysis }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fallback: return raw content
    const content = result.choices?.[0]?.message?.content;
    return new Response(
      JSON.stringify({ success: true, rawContent: content || "No response" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("meta-ai-insights error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
