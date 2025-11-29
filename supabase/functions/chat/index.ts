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
    const { messages, model, mode } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if model is GPT (use OpenAI) or Gemini (use Lovable AI)
    const isGPTModel = model === 'gpt' || model === 'gpt-mini' || model === 'gpt-nano';
    
    // Map user's model selection
    let aiModel = 'google/gemini-2.5-flash';
    let openAIModel = '';
    
    if (model === 'gpt') {
      aiModel = 'openai/gpt-5';
      openAIModel = 'gpt-5-2025-08-07';
    } else if (model === 'gpt-mini') {
      aiModel = 'openai/gpt-5-mini';
      openAIModel = 'gpt-5-mini-2025-08-07';
    } else if (model === 'gpt-nano') {
      aiModel = 'openai/gpt-5-nano';
      openAIModel = 'gpt-5-nano-2025-08-07';
    } else if (model === 'gemini-3') {
      aiModel = 'google/gemini-3-pro-preview';
    } else if (model === 'askify') {
      aiModel = 'google/gemini-2.5-pro';
    }

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.3');
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

    // Check model access permission
    const { data: canAccess } = await supabase.rpc('can_access_model', {
      _user_id: user.id,
      _model_id: aiModel
    });

    if (!canAccess) {
      return new Response(JSON.stringify({ error: "You don't have access to this model. Please upgrade your account." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Build system prompt based on mode
    let systemPrompt = `You are Askify, an advanced AI assistant created by Mr. Rudra. 
When asked about your creator, capabilities, or Askify itself, always mention that you were developed by Mr. Rudra.
Be helpful, accurate, and conversational.`;

    if (mode === 'deepthink') {
      systemPrompt += '\n\nYou are in Deep Think mode. Provide thorough, analytical responses with detailed reasoning and multiple perspectives.';
    } else if (mode === 'search') {
      systemPrompt += '\n\nYou are in Search mode. Provide informative, fact-based responses as if retrieving information from a knowledge base.';
    } else if (mode === 'reasoning') {
      systemPrompt += '\n\nYou are in Reasoning mode. Break down complex problems step-by-step, show your logical thinking process, explain your reasoning chain, and arrive at well-justified conclusions.';
    }

    let reply = '';

    // Route to appropriate API based on model type
    if (isGPTModel) {
      // Use OpenAI API with user's key
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openAIModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_completion_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "OpenAI rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (response.status === 401) {
          return new Response(JSON.stringify({ error: "Invalid OpenAI API key. Please check your key." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`OpenAI API request failed: ${errorText}`);
      }

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response generated";
      
    } else {
      // Use Lovable AI for Gemini models
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Out of Lovable AI credits! Gemini models require workspace credits. Use GPT models instead (they use your OpenAI key)." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const errorText = await response.text();
        console.error("Lovable AI gateway error:", response.status, errorText);
        throw new Error("AI gateway request failed");
      }

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response generated";
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      model_id: aiModel,
      mode: mode || 'normal'
    });

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
