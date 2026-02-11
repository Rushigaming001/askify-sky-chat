import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Missing or invalid authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized - missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's token to verify they're authenticated
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.log("Auth error:", userError?.message || "No user found");
      return new Response(JSON.stringify({ error: "Unauthorized - invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for image generation restriction
    const { data: isRestricted } = await supabase.rpc('user_has_restriction', {
      _user_id: user.id,
      _restriction_type: 'image_generation'
    });

    if (isRestricted) {
      return new Response(JSON.stringify({ error: "Image generation is disabled for your account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Image AI request from user:", user.id);

    const { action, prompt, imageUrl, style, imageModel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const POLLINATIONS_API_KEY_1 = Deno.env.get("POLLINATIONS_API_KEY_1");
    const POLLINATIONS_API_KEY_2 = Deno.env.get("POLLINATIONS_API_KEY_2");
    
    // Helper function for Pollinations image generation (free public API, no keys needed)
    // ALL image generation now uses Pollinations - no Lovable AI credits used
    function generateWithPollinations(prompt: string, model: string): string {
      console.log(`Generating with Pollinations model: ${model}`);
      
      // Map model names to Pollinations-compatible models
      // Gemini and other models are mapped to appropriate Pollinations models
      let pollinationsModel = model;
      
      // Map gemini to flux (best quality on Pollinations)
      if (model === 'gemini' || !model) {
        pollinationsModel = 'flux';
      }
      
      // Pollinations.ai is a free public API - uses URL-based generation
      const encodedPrompt = encodeURIComponent(prompt);
      const seed = Date.now();
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${pollinationsModel}&width=1024&height=1024&nologo=true&seed=${seed}`;
      
      return imageUrl;
    }

    // Image analysis using Gemini
    if (action === 'analyze' && imageUrl) {
      const apiKey = GEMINI_API_KEY || LOVABLE_API_KEY;
      if (!apiKey) {
        throw new Error("API key is not configured");
      }
      
      console.log("Analyzing image...");
      
      // Use Lovable AI Gateway for analysis
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt || "Analyze this image in detail. Describe what you see, identify objects, people, colors, mood, and any notable features."
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl }
                }
              ]
            }
          ],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Analysis API error:", response.status, errorText);
        throw new Error("Image analysis failed - please try again");
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || "No analysis generated";

      // Log usage
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        model_id: 'gemini-vision',
        mode: 'image-analysis'
      });

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image generation - ALL models now use Pollinations API (no Lovable AI credits)
    if (action === 'generate') {
      let fullPrompt = prompt;
      
      if (style === 'ghibli') {
        fullPrompt = `Studio Ghibli anime style, hand-drawn animation aesthetic, soft pastel colors, dreamy atmosphere, Hayao Miyazaki style: ${prompt}`;
      } else if (style === 'realistic') {
        fullPrompt = `Ultra photorealistic, 8K resolution, high detail, professional photography, masterpiece: ${prompt}`;
      } else if (style === 'artistic') {
        fullPrompt = `Digital art masterpiece, vibrant colors, artistic style, detailed illustration, trending on artstation: ${prompt}`;
      } else if (style === 'abstract') {
        fullPrompt = `Abstract art, geometric shapes, bold colors, modern art style, creative: ${prompt}`;
      }

      // ALL models use Pollinations - no Lovable AI credits consumed
      const selectedModel = imageModel || 'flux';
      console.log(`Using Pollinations for ALL image generation. Model: ${selectedModel}`);
      
      const generatedUrl = generateWithPollinations(fullPrompt, selectedModel);
      const modelUsed = `pollinations-${selectedModel === 'gemini' ? 'flux' : selectedModel}`;
      
      // Log usage
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        model_id: modelUsed,
        mode: 'image-generation'
      });

      return new Response(JSON.stringify({ imageUrl: generatedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image editing using Gemini or Pollinations
    if (action === 'edit' && imageUrl) {
      console.log("Editing image with prompt:", prompt);
      
      // Try using Pollinations for image editing by describing the edit
      const editPrompt = `${prompt}, based on this image: ${imageUrl}`;
      const generatedUrl = generateWithPollinations(editPrompt, 'flux');
      
      // Log usage
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        model_id: 'pollinations-edit',
        mode: 'image-edit'
      });

      return new Response(JSON.stringify({ imageUrl: generatedUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Image AI error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
