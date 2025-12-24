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
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for image generation restriction
    const { data: isRestricted } = await supabase.rpc('user_has_restriction', {
      _user_id: user.id,
      _restriction_type: 'image_generation_disabled'
    });

    if (isRestricted) {
      return new Response(JSON.stringify({ error: "Image generation is disabled for your account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Image AI request from user:", user.id);

    const { action, prompt, imageUrl, style } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const AI_HORDE_API_KEY = Deno.env.get("AI_HORDE_API_KEY");
    
    // Image analysis using Groq's vision model
    if (action === 'analyze' && imageUrl) {
      if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured");
      }
      
      console.log("Analyzing image with Groq vision...");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
          max_completion_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error:", response.status, errorText);
        throw new Error("Image analysis failed - please try again");
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || "No analysis generated";

      // Log usage
      await supabase.from('usage_logs').insert({
        user_id: user.id,
        model_id: 'groq-vision',
        mode: 'image-analysis'
      });

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image generation using AI Horde
    if (action === 'generate') {
      if (!AI_HORDE_API_KEY) {
        throw new Error("AI_HORDE_API_KEY is not configured");
      }

      console.log("Generating image with AI Horde...");
      
      let fullPrompt = prompt;
      let negativePrompt = "ugly, blurry, low quality, distorted";
      let model = "Stable Diffusion XL";
      
      if (style === 'ghibli') {
        fullPrompt = `Studio Ghibli anime style, hand-drawn animation aesthetic, soft pastel colors, dreamy atmosphere, Hayao Miyazaki style: ${prompt}`;
        negativePrompt = "realistic, 3d render, photorealistic, ugly, blurry";
        model = "AlbedoBase XL (SDXL)";
      } else if (style === 'realistic') {
        fullPrompt = `Ultra photorealistic, 8K resolution, high detail, professional photography, masterpiece: ${prompt}`;
        negativePrompt = "cartoon, anime, drawing, painting, low quality";
        model = "ICBINP XL";
      } else if (style === 'artistic') {
        fullPrompt = `Digital art masterpiece, vibrant colors, artistic style, detailed illustration, trending on artstation: ${prompt}`;
        model = "AlbedoBase XL (SDXL)";
      } else if (style === 'abstract') {
        fullPrompt = `Abstract art, geometric shapes, bold colors, modern art style, creative: ${prompt}`;
        model = "AlbedoBase XL (SDXL)";
      }

      // Submit generation request to AI Horde (using free-tier compatible parameters)
      const submitResponse = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": AI_HORDE_API_KEY,
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          params: {
            sampler_name: "k_euler",
            cfg_scale: 7,
            height: 512,
            width: 512,
            steps: 20,
            karras: true,
          },
          nsfw: false,
          censor_nsfw: true,
          models: [model],
          r2: true,
          shared: false,
        }),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error("AI Horde submit error:", submitResponse.status, errorText);
        throw new Error("Failed to start image generation");
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.id;
      console.log("AI Horde job submitted:", jobId);

      // Poll for completion (max 120 seconds)
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`, {
          headers: { "apikey": AI_HORDE_API_KEY },
        });
        
        if (!statusResponse.ok) {
          attempts++;
          continue;
        }
        
        const statusData = await statusResponse.json();
        console.log("AI Horde status:", statusData);
        
        if (statusData.done) {
          // Get the final result
          const resultResponse = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`, {
            headers: { "apikey": AI_HORDE_API_KEY },
          });
          
          if (!resultResponse.ok) {
            throw new Error("Failed to get generated image");
          }
          
          const resultData = await resultResponse.json();
          console.log("AI Horde result received");
          
          if (resultData.generations && resultData.generations.length > 0) {
            const imageUrl = resultData.generations[0].img;

            // Log usage
            await supabase.from('usage_logs').insert({
              user_id: user.id,
              model_id: 'ai-horde-sdxl',
              mode: 'image-generation'
            });

            return new Response(JSON.stringify({ imageUrl }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          throw new Error("No image was generated");
        }
        
        if (statusData.faulted) {
          throw new Error("Image generation failed");
        }
        
        attempts++;
      }
      
      throw new Error("Image generation timed out - please try again");
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