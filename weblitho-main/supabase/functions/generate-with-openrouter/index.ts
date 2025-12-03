import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, conversationHistory = [], model = "x-ai/grok-4.1-fast:free" } = await req.json();
    const OPENROUTER_KEY = Deno.env.get('OPENROUTER_KEY');

    if (!OPENROUTER_KEY) {
      throw new Error('OPENROUTER_KEY is not configured');
    }

    const systemPrompt = `You are an expert frontend developer. Generate clean, modern, responsive HTML code with inline TailwindCSS styling.

CRITICAL RULES:
- Use only HTML + inline Tailwind CSS classes
- Make it visually stunning and modern
- Use proper semantic HTML
- Ensure mobile responsiveness
- Include smooth animations and transitions
- Use modern color schemes and gradients
- Return ONLY the HTML code, no explanations

Generate production-ready code that looks professional.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: prompt }
    ];

    console.log('Calling OpenRouter API with Grok model...');

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenRouter API error: ${response.status}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in generate-with-openrouter function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});