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

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    const POLLINATIONS_API_KEY_1 = Deno.env.get("POLLINATIONS_API_KEY_1");
    const POLLINATIONS_API_KEY_2 = Deno.env.get("POLLINATIONS_API_KEY_2");

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
    
    // Helper function for Pollinations video generation with failover
    async function generateVideoWithPollinations(prompt: string): Promise<string> {
      const keys = [POLLINATIONS_API_KEY_1, POLLINATIONS_API_KEY_2].filter(Boolean);
      
      for (const apiKey of keys) {
        try {
          console.log("Trying Pollinations video generation...");
          
          // Pollinations.ai video generation endpoint
          const encodedPrompt = encodeURIComponent(prompt);
          const videoUrl = `https://video.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&fps=24&duration=4`;
          
          // Verify the video endpoint is accessible
          const response = await fetch(videoUrl, { method: 'HEAD' });
          if (response.ok || response.status === 302) {
            return videoUrl;
          }
          
          console.log("Pollinations video failed, trying next key...");
        } catch (error) {
          console.log("Pollinations API key failed, trying next key...", error);
        }
      }
      
      throw new Error("All Pollinations API keys failed for video generation");
    }

    // Check if user selected Pollinations model
    if (videoModel === 'pollinations') {
      if (!POLLINATIONS_API_KEY_1 && !POLLINATIONS_API_KEY_2) {
        return new Response(JSON.stringify({ error: "Pollinations API keys not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
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
        console.error("Pollinations video generation failed:", error);
        return new Response(JSON.stringify({ error: "Video generation failed. Please try again." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Default: Use Replicate (Luma Ray) with Pollinations fallback
    if (!REPLICATE_API_KEY) {
      // Try Pollinations if no Replicate key
      if (POLLINATIONS_API_KEY_1 || POLLINATIONS_API_KEY_2) {
        const videoUrl = await generateVideoWithPollinations(prompt);
        
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
      }
      throw new Error('No video generation API key configured');
    }

    try {
      const { default: Replicate } = await import("https://esm.sh/replicate@0.30.2");
      const replicate = new Replicate({
        auth: REPLICATE_API_KEY,
      });
      
      // Use Luma AI's Dream Machine for faster, text-to-video generation
      const output = await replicate.run("luma/ray", {
        input: {
          prompt: prompt,
          aspect_ratio: "16:9",
          loop: false
        }
      });

      console.log("Video generation completed:", output);
      
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
      console.log("Replicate failed, trying Pollinations fallback...", error);
      
      // Fallback to Pollinations
      if (POLLINATIONS_API_KEY_1 || POLLINATIONS_API_KEY_2) {
        const videoUrl = await generateVideoWithPollinations(prompt);
        
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
      }
      
      throw error;
    }
  } catch (error) {
    console.error("Error in video-ai function:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
