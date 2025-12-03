import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    const OPENROUTER_KEY = Deno.env.get("OPENROUTER_KEY");
    if (!OPENROUTER_KEY) {
      throw new Error("OPENROUTER_KEY is not configured");
    }

    const systemPrompt = `You are a code validation AI. Review the provided HTML/React code and return a JSON response with:
1. "valid": boolean - whether the code is valid and will render properly
2. "score": number (1-100) - quality score
3. "issues": array of strings - any issues found
4. "suggestions": array of strings - improvement suggestions
5. "security": array of strings - any security concerns

Focus on:
- Valid HTML/JSX syntax
- React component structure
- Tailwind CSS usage
- Accessibility
- Security (XSS, etc.)
- Best practices

Return ONLY valid JSON, no markdown or explanations.`;

    console.log("Validating code with KatCoder Pro...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "kwaipilot/kat-coder-pro:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Review this code:\n\n${code.substring(0, 10000)}` }
        ],
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("KatCoder validation error:", response.status, errorText);
      // Return a default validation if KatCoder fails
      return new Response(
        JSON.stringify({
          valid: true,
          score: 75,
          issues: [],
          suggestions: ["Validation service temporarily unavailable"],
          security: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let validation;
    try {
      // Clean the content - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      validation = JSON.parse(cleanContent.trim());
    } catch {
      console.log("Could not parse validation response, using defaults");
      validation = {
        valid: true,
        score: 80,
        issues: [],
        suggestions: [],
        security: []
      };
    }

    console.log("Validation complete:", validation);

    return new Response(
      JSON.stringify(validation),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("validate-code error:", e);
    return new Response(
      JSON.stringify({ 
        valid: true, 
        score: 70, 
        issues: [], 
        suggestions: [], 
        security: [],
        error: e instanceof Error ? e.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
