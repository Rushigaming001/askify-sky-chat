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
    const { action, prompt, imageUrl, style } = await req.json();
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
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
        throw new Error("Image analysis failed - please try again");
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content || "No analysis generated";

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image generation using Lovable AI (Gemini image model)
    if (action === 'generate') {
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured for image generation");
      }

      console.log("Generating image with Lovable AI...");
      
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
              content: `Generate a high-quality image: ${fullPrompt}`
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", response.status, errorText);
        
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (response.status === 402) {
          throw new Error("Out of Lovable AI credits. Please add credits in Settings → Workspace → Usage.");
        }
        
        throw new Error("Image generation failed - please try again");
      }

      const data = await response.json();
      console.log("Lovable AI response received");
      
      // Extract image from the response
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageData) {
        console.error("No image in response:", JSON.stringify(data).substring(0, 500));
        throw new Error("No image was generated - please try a different prompt");
      }

      return new Response(JSON.stringify({ imageUrl: imageData }), {
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