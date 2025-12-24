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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
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

    const { action, prompt, imageUrl, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
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

    // Image generation using Lovable AI Gateway (Gemini image model)
    if (action === 'generate') {
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      console.log("Generating image with Lovable AI...");
      
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

      // Use Lovable AI Gateway for image generation
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Generate a high-quality image: ${fullPrompt}. Make it visually stunning and detailed.`
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Image generation error:", response.status, errorText);
        throw new Error("Failed to generate image - please try again");
      }

      const data = await response.json();
      console.log("Image generation response received");
      
      // Extract image from response
      const images = data.choices?.[0]?.message?.images;
      if (images && images.length > 0) {
        const imageUrl = images[0].image_url?.url;
        
        if (imageUrl) {
          // Log usage
          await supabase.from('usage_logs').insert({
            user_id: user.id,
            model_id: 'gemini-image',
            mode: 'image-generation'
          });

          return new Response(JSON.stringify({ imageUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      throw new Error("No image was generated - please try again with a different prompt");
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Image AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});