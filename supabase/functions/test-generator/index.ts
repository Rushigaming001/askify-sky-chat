import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all available API keys
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const COHERE_API_KEY = Deno.env.get("COHERE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const POLLINATIONS_API_KEY_1 = Deno.env.get("POLLINATIONS_API_KEY_1");
    const POLLINATIONS_API_KEY_2 = Deno.env.get("POLLINATIONS_API_KEY_2");

    const systemPrompt = `You are an expert Maharashtra State Board question paper creator. Generate complete, well-formatted question papers with proper spacing and clear section divisions. Follow the exact pattern of shala.com and balbharti.com papers.`;

    let result = '';

    // 1. Try Groq first (fastest - 5-10 seconds)
    if (GROQ_API_KEY && !result) {
      try {
        console.log("Trying Groq API (fastest)...");
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          result = data.choices?.[0]?.message?.content || '';
          if (result) console.log("Groq success!");
        } else {
          console.log("Groq failed:", response.status);
        }
      } catch (e) {
        console.log("Groq error:", e);
      }
    }

    // 2. Try Cohere (fast fallback)
    if (COHERE_API_KEY && !result) {
      try {
        console.log("Trying Cohere API...");
        const response = await fetch('https://api.cohere.ai/v2/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command-r-08-2024',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          result = data.message?.content?.[0]?.text || '';
          if (result) console.log("Cohere success!");
        } else {
          console.log("Cohere failed:", response.status);
        }
      } catch (e) {
        console.log("Cohere error:", e);
      }
    }

    // 3. Try Pollinations Key 1
    if (POLLINATIONS_API_KEY_1 && !result) {
      try {
        console.log("Trying Pollinations Key 1...");
        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${POLLINATIONS_API_KEY_1}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          result = data.choices?.[0]?.message?.content || '';
          if (result) console.log("Pollinations Key 1 success!");
        } else {
          console.log("Pollinations Key 1 failed:", response.status);
        }
      } catch (e) {
        console.log("Pollinations Key 1 error:", e);
      }
    }

    // 4. Try Pollinations Key 2
    if (POLLINATIONS_API_KEY_2 && !result) {
      try {
        console.log("Trying Pollinations Key 2...");
        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${POLLINATIONS_API_KEY_2}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          result = data.choices?.[0]?.message?.content || '';
          if (result) console.log("Pollinations Key 2 success!");
        } else {
          console.log("Pollinations Key 2 failed:", response.status);
        }
      } catch (e) {
        console.log("Pollinations Key 2 error:", e);
      }
    }

    // 5. Try Lovable AI (final fallback)
    if (LOVABLE_API_KEY && !result) {
      try {
        console.log("Trying Lovable AI (final fallback)...");
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          result = data.choices?.[0]?.message?.content || '';
          if (result) console.log("Lovable AI success!");
        } else {
          console.log("Lovable AI failed:", response.status);
        }
      } catch (e) {
        console.log("Lovable AI error:", e);
      }
    }

    if (!result) {
      return new Response(JSON.stringify({ error: "All AI services unavailable. Please try again later." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ paper: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Test generator error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
