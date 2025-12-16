import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.30.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, imageUrl, style } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Image analysis using Groq's vision model
    if (action === 'analyze' && imageUrl) {
      console.log("Analyzing image with Groq vision...");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
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
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error:", response.status, errorText);
        throw new Error("Groq API request failed");
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || "No analysis generated";

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image generation using Replicate's FLUX model
    if (action === 'generate') {
      if (!REPLICATE_API_KEY) {
        throw new Error("REPLICATE_API_KEY is not configured for image generation");
      }

      console.log("Generating image with Replicate FLUX...");
      
      const replicate = new Replicate({ auth: REPLICATE_API_KEY });
      
      let fullPrompt = prompt;
      if (style === 'ghibli') {
        fullPrompt = `Studio Ghibli anime style, hand-drawn animation aesthetic, soft pastel colors, dreamy atmosphere: ${prompt}`;
      } else if (style === 'realistic') {
        fullPrompt = `Ultra photorealistic, 8K, high detail, professional photography: ${prompt}`;
      } else if (style === 'artistic') {
        fullPrompt = `Digital art, vibrant colors, artistic style, detailed illustration: ${prompt}`;
      } else if (style === 'abstract') {
        fullPrompt = `Abstract art, geometric shapes, bold colors, modern art style: ${prompt}`;
      }

      const output = await replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: fullPrompt,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 90
        }
      });

      let imageUrlResult: string;
      if (Array.isArray(output) && output.length > 0) {
        imageUrlResult = output[0];
      } else if (typeof output === 'string') {
        imageUrlResult = output;
      } else {
        throw new Error("Unexpected output format from image generation");
      }

      console.log("Image generated successfully:", imageUrlResult);

      return new Response(JSON.stringify({ imageUrl: imageUrlResult }), {
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
