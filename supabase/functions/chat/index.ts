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

    // Check if model is GPT (use OpenRouter), Gemini (use Google AI), or NVIDIA NIM
    const isGPTModel = model === 'gpt' || model === 'gpt-mini' || model === 'gpt-nano';
    const isGeminiModel = model === 'gemini' || model === 'gemini-3' || model === 'askify';
    const isNvidiaModel = model === 'nvidia';
    
    // Map user's model selection
    let aiModel = 'gemini-2.0-flash-exp';
    let openAIModel = '';
    let geminiModel = '';
    let nvidiaModel = '';
    
    if (model === 'gpt') {
      aiModel = 'openai/gpt-5';
      openAIModel = 'gpt-5-2025-08-07';
    } else if (model === 'gpt-mini') {
      aiModel = 'openai/gpt-5-mini';
      openAIModel = 'gpt-5-mini-2025-08-07';
    } else if (model === 'gpt-nano') {
      aiModel = 'openai/gpt-5-nano';
      openAIModel = 'gpt-5-nano-2025-08-07';
    } else if (model === 'gemini' || !model) {
      aiModel = 'google/gemini-2.5-flash';
      geminiModel = 'gemini-2.0-flash-exp';
    } else if (model === 'gemini-3') {
      aiModel = 'google/gemini-3-pro-preview';
      geminiModel = 'gemini-exp-1206';
    } else if (model === 'askify') {
      aiModel = 'google/gemini-2.5-pro';
      geminiModel = 'gemini-2.0-pro-exp';
    } else if (model === 'nvidia') {
      aiModel = 'meta/llama-3.1-8b-instruct';
      nvidiaModel = 'meta/llama-3.1-8b-instruct';
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
      // Use OpenRouter API with user's key for GPT models
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: "OpenRouter API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
      
    } else if (isGeminiModel) {
      // Use Google AI API with user's key for Gemini models
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      
      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Format messages for Gemini API
      const contents = messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Add system prompt as first user message
      contents.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Gemini rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (response.status === 401 || response.status === 403) {
          return new Response(JSON.stringify({ error: "Invalid Gemini API key. Please check your key." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`Gemini API request failed: ${errorText}`);
      }

      const data = await response.json();
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
    } else if (isNvidiaModel) {
      // Use NVIDIA NIM API with user's key
      const NVIDIA_NIM_API_KEY = Deno.env.get("NVIDIA_NIM_API_KEY");
      
      if (!NVIDIA_NIM_API_KEY) {
        return new Response(JSON.stringify({ error: "NVIDIA NIM API key not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_NIM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: nvidiaModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("NVIDIA NIM API error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "NVIDIA NIM rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (response.status === 401) {
          return new Response(JSON.stringify({ error: "Invalid NVIDIA NIM API key. Please check your key." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`NVIDIA NIM API request failed: ${errorText}`);
      }

      const data = await response.json();
      reply = data.choices?.[0]?.message?.content || "No response generated";
    } else {
      return new Response(JSON.stringify({ error: "Invalid model selection" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
