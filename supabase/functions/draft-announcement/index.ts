import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { note } = await req.json();

    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A rough note is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (note.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Note is too long (max 2000 chars)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `You are an assistant that rewrites a teacher's rough notes into a clean, formal announcement to be posted on a student notice board for a tutoring institute called BatchFlow.

Rules:
- Output ONLY a JSON object with "title" and "content" fields. No markdown, no extra commentary.
- "title" must be short (max 80 chars), specific, and informative (e.g., "Mathematics Test — Monday, Chapter 4 & 5").
- "content" must be a polished announcement of 3-6 short sentences.
- Use a warm but professional tone. Address students directly ("Dear students,").
- Preserve every concrete detail from the note (dates, chapters, items to bring, venue, etc.). Do NOT invent facts.
- Use clear formatting: line breaks between sections if useful, bullet points only when listing 3+ items.
- End with a brief closing line (e.g., "Please be punctual." or "Reach out if you have questions.").`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Rough note from teacher:\n"""${note.trim()}"""` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "post_announcement",
              description: "Return the polished announcement.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short, informative title (max 80 chars)." },
                  content: { type: "string", description: "Polished announcement body (3-6 sentences)." },
                },
                required: ["title", "content"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "post_announcement" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      return new Response(
        JSON.stringify({ error: "AI gateway error." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call in response", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return a structured response." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON.parse(argsStr);
    return new Response(
      JSON.stringify({ title: parsed.title ?? "", content: parsed.content ?? "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("draft-announcement error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
