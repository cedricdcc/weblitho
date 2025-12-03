import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model mapping: frontend names to actual model IDs
const MODEL_MAPPING: Record<string, { provider: "openrouter" | "lovable"; model: string }> = {
  // Free model uses OpenRouter - DeepSeek R1T2 Chimera
  "deepseek-free": { provider: "openrouter", model: "tngtech/deepseek-r1t2-chimera:free" },
  // Premium models use Lovable AI Gateway
  "google/gemini-2.0-flash": { provider: "lovable", model: "google/gemini-2.0-flash" },
  "google/gemini-2.0-pro": { provider: "lovable", model: "google/gemini-2.5-pro" },
  "google/gemini-2.5-pro": { provider: "lovable", model: "google/gemini-2.5-pro" },
  "google/gemini-2.5-flash": { provider: "lovable", model: "google/gemini-2.5-flash" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, conversationHistory = [], currentCode = null, model = "google/gemini-2.0-flash" } = await req.json();

    // Detect if this is a modification request or new generation
    const isModification = currentCode !== null && currentCode.length > 100;

    // Build the appropriate system prompt based on mode
    const systemPrompt = isModification 
      ? buildModificationPrompt(currentCode)
      : buildGenerationPrompt();

    // Get the actual model and provider
    const modelConfig = MODEL_MAPPING[model] || { provider: "openrouter", model: "tngtech/deepseek-r1t2-chimera:free" };
    
    console.log("Weblitho generating:", {
      requestedModel: model,
      actualProvider: modelConfig.provider,
      actualModel: modelConfig.model,
      mode: isModification ? "MODIFICATION" : "NEW"
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: prompt }
    ];

    let response: Response;

    if (modelConfig.provider === "openrouter") {
      // Use OpenRouter API for free model
      const OPENROUTER_KEY = Deno.env.get("OPENROUTER_KEY");
      if (!OPENROUTER_KEY) {
        throw new Error("OPENROUTER_KEY is not configured");
      }

      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://weblitho.app",
          "X-Title": "Weblitho AI Website Builder",
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages,
          stream: true,
        }),
      });
    } else {
      // Use Lovable AI Gateway for premium models
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages,
          stream: true,
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("Weblitho generate-page error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ===========================================
// NEW GENERATION PROMPT - Dual Output System
// ===========================================
function buildGenerationPrompt(): string {
  return `You are Weblitho — Qubetics' AI Website Builder, a dual-output system.

=========================================
OUTPUT FORMAT (CRITICAL)

You MUST output a JSON object with TWO keys:
1. "files" — Full Next.js 14 App Router project structure
2. "preview" — Self-contained HTML with CDN React for iframe preview

BOTH must render the SAME visual design but in different formats.

START YOUR OUTPUT WITH: {"files":[
END YOUR OUTPUT WITH: </html>"}

NO MARKDOWN. NO CODE FENCES. NO EXPLANATIONS. PURE JSON.

=========================================
JSON STRUCTURE

{
  "files": [
    { "path": "app/layout.tsx", "content": "..." },
    { "path": "app/page.tsx", "content": "..." },
    { "path": "components/layout/Navbar.tsx", "content": "..." },
    { "path": "components/layout/Footer.tsx", "content": "..." },
    { "path": "components/sections/Hero.tsx", "content": "..." },
    { "path": "components/sections/Features.tsx", "content": "..." },
    { "path": "components/sections/CTA.tsx", "content": "..." }
  ],
  "preview": "<!DOCTYPE html>...(full HTML with CDN React)...</html>"
}

=========================================
NEXT.JS FILES STRUCTURE

Required files in "files" array:

app/layout.tsx:
- Root layout with html, body tags
- Import global styles
- Use Inter font from next/font
- Dark theme default

app/page.tsx:
- Import and compose all sections
- Server component by default

components/layout/Navbar.tsx:
- "use client" for interactivity
- Mobile hamburger menu
- Sticky positioning
- Glass morphism background

components/layout/Footer.tsx:
- Multi-column links
- Social icons
- Newsletter input

components/sections/Hero.tsx:
- Large headline (text-5xl+)
- Gradient text effects
- 2 CTA buttons
- Animated background elements

components/sections/Features.tsx:
- Bento grid layout
- Icon cards
- Hover animations

components/sections/CTA.tsx:
- Gradient background
- Compelling headline
- Glowing button

=========================================
PREVIEW HTML FORMAT

The "preview" value must be a complete, self-contained HTML document:

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          animation: {
            'fade-in': 'fadeIn 0.5s ease-out',
            'slide-up': 'slideUp 0.5s ease-out',
          },
          keyframes: {
            fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
          }
        }
      }
    }
  </script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.min.js"></script>
</head>
<body class="antialiased bg-gray-950 text-white">
  <div id="root"></div>
  <script type="text/babel">
    // React components matching the Next.js version visually
  </script>
</body>
</html>

=========================================
DESIGN RULES (BOTH OUTPUTS MUST FOLLOW)

All websites MUST look premium and modern like:
- Vercel, Framer, Stripe, Linear, Lovable

MANDATORY DESIGN QUALITIES:
- Large hero sections (text-5xl to text-7xl headlines)
- Generous spacing (py-20 to py-32 for sections)
- max-w-7xl mx-auto containers
- Premium gradients (cyan, purple, blue)
- Rounded-2xl components
- Smooth transitions (transition-all duration-300)
- Responsive grid layouts (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Clean typography hierarchy
- Professional color palette (gray-950 base, white text)
- Glass morphism (backdrop-blur, bg-white/5)
- Hover states on ALL interactive elements
- Dark theme default

=========================================
REQUIRED SECTIONS

Every website MUST include:
1. Navbar — sticky, glass morphism, mobile menu
2. Hero — large headline, gradient text, CTAs
3. Features — bento grid with icons
4. CTA — gradient background, action button
5. Footer — multi-column, social links

Optional based on request:
- Pricing, Testimonials, FAQ, About, Blog

=========================================
TECHNOLOGY RULES

Next.js files:
- TypeScript (.tsx)
- "use client" only when needed
- Tailwind CSS classes
- lucide-react icons
- Clean imports

Preview HTML:
- React 18 via CDN
- Babel for JSX
- Tailwind via CDN
- lucide-react via CDN

=========================================
CRITICAL RULES

1. Output ONLY valid JSON — no markdown, no backticks
2. Start with {"files":[
3. "files" array contains Next.js project files
4. "preview" contains complete HTML string (escape quotes)
5. Both render the SAME visual design
6. Use \\" for quotes inside JSON strings
7. Use \\n for newlines in content
8. NO explanations before or after JSON

Generate the website now as JSON.`;
}

// ===========================================
// MODIFICATION PROMPT - Changes existing code
// ===========================================
function buildModificationPrompt(currentCode: string): string {
  return `You are Weblitho, modifying an EXISTING website.

OUTPUT FORMAT: Return ONLY the complete modified HTML document.
NO JSON for modifications. NO explanations. NO markdown.
Start with <!DOCTYPE html> and end with </html>.

CURRENT CODE:
${currentCode}

MODIFICATION RULES:
1. Make ONLY the requested changes
2. PRESERVE everything else exactly
3. Keep React CDN, Tailwind, Lucide stack
4. Return the COMPLETE modified HTML

DO NOT:
- Regenerate everything
- Remove components unless asked
- Change unrelated sections
- Add explanations

Return the modified HTML now.`;
}
