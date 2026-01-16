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

    const body = await req.json();
    const { chapterText, chapterTitle, useLovableAI } = body;

    if (!chapterText || chapterText.trim().length < 50) {
      return new Response(JSON.stringify({ 
        error: "Please provide chapter text with at least 50 characters" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user wants to use Lovable AI (only for owner)
    if (useLovableAI) {
      const { data: isOwner } = await supabase.rpc('is_owner', { _user_id: user.id });
      
      if (!isOwner) {
        return new Response(JSON.stringify({ 
          error: "Lovable AI is only available for the owner. Please use the free AI option." 
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Generating chapter explanation for:", chapterTitle, "User:", user.id);

    const POLLINATIONS_API_KEY_1 = Deno.env.get('POLLINATIONS_API_KEY_1');
    const POLLINATIONS_API_KEY_2 = Deno.env.get('POLLINATIONS_API_KEY_2');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const systemPrompt = `You are an expert educational content creator specializing in creating engaging video scripts for students. 
Your task is to transform chapter content into a detailed video script that would work for an animated educational video.

Create a comprehensive video script with:
1. **Introduction** (Hook the viewer, state what they'll learn)
2. **Key Concepts** (Break down each concept clearly with examples)
3. **Visual Descriptions** (Describe what animations/graphics should appear)
4. **Dialogue/Narration** (What the narrator/characters should say)
5. **Scene Transitions** (How to move between topics smoothly)
6. **Summary** (Recap key points)
7. **Quiz Questions** (2-3 questions to test understanding)

Make it engaging, student-friendly, and easy to understand. Use simple language and relatable examples.
Format the script clearly with scene numbers and timestamps.`;

    let explanation = '';
    let usedModel = '';

    // If user wants Lovable AI and is owner
    if (useLovableAI && LOVABLE_API_KEY) {
      try {
        console.log("Using Lovable AI for owner...");
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Create a detailed video script for this chapter:\n\nTitle: ${chapterTitle || 'Chapter Explanation'}\n\nContent:\n${chapterText.substring(0, 8000)}` }
            ],
            max_tokens: 4000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          explanation = data.choices?.[0]?.message?.content || '';
          usedModel = 'lovable-gemini-pro';
        } else {
          throw new Error("Lovable AI failed");
        }
      } catch (error) {
        console.error("Lovable AI error:", error);
        return new Response(JSON.stringify({ error: "Lovable AI service unavailable" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Use Pollinations (free for everyone)
      const callPollinations = async (apiKey: string): Promise<string> => {
        const response = await fetch('https://text.pollinations.ai/openai', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Create a detailed video script for this chapter:\n\nTitle: ${chapterTitle || 'Chapter Explanation'}\n\nContent:\n${chapterText.substring(0, 6000)}` }
            ],
            max_tokens: 3000,
          }),
        });

        if (!response.ok) {
          throw new Error(`Pollinations error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      };

      // Try Pollinations Key 1
      if (POLLINATIONS_API_KEY_1) {
        try {
          explanation = await callPollinations(POLLINATIONS_API_KEY_1);
          usedModel = 'pollinations-key1';
        } catch (err) {
          console.log("Pollinations Key 1 failed, trying Key 2...", err);
        }
      }

      // Try Pollinations Key 2 if Key 1 failed
      if (!explanation && POLLINATIONS_API_KEY_2) {
        try {
          explanation = await callPollinations(POLLINATIONS_API_KEY_2);
          usedModel = 'pollinations-key2';
        } catch (err) {
          console.log("Pollinations Key 2 also failed", err);
        }
      }

      // Fallback to Lovable AI if Pollinations fails (for any user)
      if (!explanation && LOVABLE_API_KEY) {
        try {
          console.log("Both Pollinations keys failed, using Lovable AI fallback...");
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: systemPrompt },
                { role: 'user', content: `Create a detailed video script for this chapter:\n\nTitle: ${chapterTitle || 'Chapter Explanation'}\n\nContent:\n${chapterText.substring(0, 4000)}` }
              ],
              max_tokens: 2000,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            explanation = data.choices?.[0]?.message?.content || '';
            usedModel = 'lovable-fallback';
          }
        } catch (error) {
          console.error("Lovable fallback error:", error);
        }
      }
    }

    if (!explanation) {
      return new Response(JSON.stringify({ error: "All AI services unavailable. Please try again later." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      model_id: `chapter-video-${usedModel}`,
      mode: 'chapter-explanation'
    });

    console.log("Successfully generated chapter explanation using:", usedModel);

    return new Response(JSON.stringify({ 
      script: explanation,
      model: usedModel,
      status: 'succeeded'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in chapter-video function:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})