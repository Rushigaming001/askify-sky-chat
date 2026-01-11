import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Check for video generation restriction
    const { data: isRestricted } = await supabase.rpc('user_has_restriction', {
      _user_id: user.id,
      _restriction_type: 'video_generation_disabled'
    });

    if (isRestricted) {
      return new Response(JSON.stringify({ error: "Video generation is disabled for your account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    if (!body.prompt) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required field: prompt is required" 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { prompt, videoModel } = body;
    
    console.log("Generating video for user:", user.id, "prompt:", prompt, "model:", videoModel);
    
    // Try Pollinations.ai first - it's a free video generation service
    async function generateVideoWithPollinations(prompt: string): Promise<string> {
      console.log("Using Pollinations.ai for video generation...");
      
      // Pollinations.ai video generation endpoint
      const encodedPrompt = encodeURIComponent(prompt);
      const videoUrl = `https://video.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&fps=24&duration=4`;
      
      // Verify the video endpoint is accessible
      try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        if (response.ok || response.status === 302 || response.status === 200) {
          console.log("Pollinations video URL generated successfully");
          return videoUrl;
        }
      } catch (error) {
        console.log("Pollinations HEAD check failed, returning URL anyway:", error);
      }
      
      // Return URL anyway - Pollinations generates on-demand
      return videoUrl;
    }

    // Try Replicate with Luma Ray if API key is available
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    
    if (REPLICATE_API_KEY && videoModel !== 'pollinations') {
      try {
        console.log("Trying Replicate with Luma Ray...");
        const { default: Replicate } = await import("https://esm.sh/replicate@0.30.2");
        const replicate = new Replicate({
          auth: REPLICATE_API_KEY,
        });
        
        // Use Luma AI's Dream Machine for text-to-video generation
        const output = await replicate.run("luma/ray", {
          input: {
            prompt: prompt,
            aspect_ratio: "16:9",
            loop: false
          }
        });

        console.log("Replicate video generation completed:", output);
        
        // Get the video URL from the output
        let videoUrl: string;
        if (typeof output === 'string') {
          videoUrl = output;
        } else if (output && typeof output.url === 'function') {
          videoUrl = output.url();
        } else if (Array.isArray(output) && output.length > 0) {
          videoUrl = output[0];
        } else {
          videoUrl = String(output);
        }

        // Log usage
        await supabase.from('usage_logs').insert({
          user_id: user.id,
          model_id: 'luma-ray',
          mode: 'video-generation'
        });
        
        return new Response(JSON.stringify({ 
          output: videoUrl,
          status: 'succeeded'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (error) {
        console.log("Replicate failed, falling back to Pollinations:", error);
      }
    }

    // Default fallback: Use Pollinations.ai (free, no API key required)
    const videoUrl = await generateVideoWithPollinations(prompt);
    
    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      model_id: 'pollinations-video',
      mode: 'video-generation'
    });
    
    return new Response(JSON.stringify({ 
      output: videoUrl,
      status: 'succeeded'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in video-ai function:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})