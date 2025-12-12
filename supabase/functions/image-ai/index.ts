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
          model: "llama-3.2-90b-vision-preview",
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

    // Image generation - use description-based response since Groq doesn't generate images
    if (action === 'generate') {
      console.log("Generating image description with Groq...");
      
      let fullPrompt = prompt;
      if (style === 'ghibli') {
        fullPrompt = `Studio Ghibli style: ${prompt}`;
      } else if (style === 'realistic') {
        fullPrompt = `Photorealistic: ${prompt}`;
      } else if (style === 'artistic') {
        fullPrompt = `Digital art: ${prompt}`;
      } else if (style === 'abstract') {
        fullPrompt = `Abstract art: ${prompt}`;
      }

      // Generate a placeholder image URL or use a fallback
      // Since Groq doesn't generate images, we'll provide a helpful message
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are an AI that describes images. Generate a detailed visual description for the following prompt that could be used to create an image."
            },
            {
              role: "user",
              content: fullPrompt
            }
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API error:", response.status, errorText);
        throw new Error("Groq API request failed");
      }

      // Return a placeholder since Groq doesn't generate images
      // The frontend will need to handle this appropriately
      return new Response(JSON.stringify({ 
        imageUrl: `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(prompt.substring(0, 30))}`,
        description: "Image generation via Groq is not available. Please use text-based AI features.",
        error: "Image generation requires a dedicated image model. Current Groq integration supports image analysis only."
      }), {
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
