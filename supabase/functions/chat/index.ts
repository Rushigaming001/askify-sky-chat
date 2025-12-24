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
    // Get user from auth header first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate input
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, model, mode } = requestBody;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 100) {
      return new Response(JSON.stringify({ error: "Too many messages (max 100)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each message
    const validRoles = ['user', 'assistant', 'system'];
    for (const msg of messages) {
      if (!msg.role || !validRoles.includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof msg.content !== 'string' || msg.content.length === 0) {
        return new Response(JSON.stringify({ error: "Message content is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Message content too long (max 10000 chars)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate optional mode
    const validModes = ['normal', 'deepthink', 'search', 'reasoning'];
    if (mode && !validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All models use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Lovable AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map user's model selection to AI models
    // Default to Groq (Core) model
    let aiModel = '';
    let useExternalApi = false;
    let externalApiUrl = '';
    let externalApiKey = '';
    
    // New models with external APIs
    if (model === 'grok' || !model) {
      // Groq API (Core - default)
      useExternalApi = true;
      externalApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      externalApiKey = Deno.env.get('GROQ_API_KEY') || '';
      aiModel = 'llama-3.3-70b-versatile';
    } else if (model === 'cohere') {
      // Cohere API (Pro) - using command-r-08-2024 (command-r-plus was deprecated)
      useExternalApi = true;
      externalApiUrl = 'https://api.cohere.ai/v2/chat';
      externalApiKey = Deno.env.get('COHERE_API_KEY') || '';
      aiModel = 'command-r-08-2024';
    } else if (model === 'deepseek') {
      // DeepSeek API (Lite)
      useExternalApi = true;
      externalApiUrl = 'https://api.deepseek.com/chat/completions';
      externalApiKey = Deno.env.get('DEEPSEEK_API_KEY') || '';
      aiModel = 'deepseek-chat';
    } else if (model === 'gpt') {
      aiModel = 'openai/gpt-5';
    } else if (model === 'gpt-mini') {
      aiModel = 'openai/gpt-5-mini';
    } else if (model === 'gpt-nano') {
      aiModel = 'openai/gpt-5-nano';
    } else if (model === 'gemini') {
      aiModel = 'google/gemini-2.5-flash';
    } else if (model === 'gemini-lite') {
      aiModel = 'google/gemini-2.5-flash-lite';
    } else if (model === 'gemini-3') {
      aiModel = 'google/gemini-3-pro-preview';
    } else if (model === 'nano-banana') {
      aiModel = 'google/gemini-2.5-flash-image-preview';
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

    // Check model access permission (skip for external API models)
    if (!useExternalApi) {
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
    }
    
    // System prompt with creator attribution
    let systemPrompt = 'You are ASKIFY, an AI assistant created by Mr. Rudra (also known as Rushi), who is the creator, owner, and CEO of ASKIFY. When greeting users or when asked about your creator, owner, CEO, or who made you, always mention that you were created by Mr. Rudra.';

    if (mode === 'deepthink') {
      systemPrompt += `

DEEP THINKING MODE ACTIVATED:
You must think deeply and thoroughly about every question. Follow this structure:
1. **Understanding**: First, fully understand what the user is asking
2. **Analysis**: Break down the problem into components
3. **Exploration**: Explore multiple angles and perspectives
4. **Reasoning**: Provide detailed logical reasoning for each point
5. **Conclusion**: Give a comprehensive, well-structured answer

Take your time. Be thorough. Explain your thought process step by step. Consider edge cases and alternative viewpoints. Provide examples where helpful.`;
    } else if (mode === 'search') {
      systemPrompt += `

SEARCH/INFORMATION MODE ACTIVATED:
Act as if you have access to the latest information. Provide:
1. **Key Facts**: Start with the most important information
2. **Sources**: Mention where such information typically comes from (e.g., "According to official documentation...", "Based on industry standards...")
3. **Context**: Provide relevant background information
4. **Related Topics**: Suggest related areas the user might want to explore
5. **Actionable Links**: When relevant, suggest what to search for more information

Be informative, comprehensive, and cite your reasoning. Structure information clearly with headers and bullet points.`;
    } else if (mode === 'reasoning') {
      systemPrompt += `

REASONING/LOGIC MODE ACTIVATED:
Use rigorous step-by-step logical reasoning:
1. **Premise**: State the initial premises clearly
2. **Logic Chain**: Show each logical step with "Therefore..." or "It follows that..."
3. **Evidence**: Support each step with evidence or logical justification
4. **Counterarguments**: Consider and address potential counterarguments
5. **Conclusion**: Draw a clear, logical conclusion

Format: Use numbered steps. Be precise. Avoid logical fallacies. Show your work like solving a math problem.`;
    } else {
      systemPrompt += ' Respond clearly and concisely.';
    }

    let reply = '';

    // Handle external API calls
    if (useExternalApi) {
      if (!externalApiKey) {
        return new Response(JSON.stringify({ error: `API key not configured for ${model}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let response;
      
      if (model === 'cohere') {
        // Cohere v2 API format
        const cohereMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          }))
        ];
        
        response = await fetch(externalApiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${externalApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: aiModel,
            messages: cohereMessages
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Cohere API error:", response.status, errorText);
          throw new Error(`Cohere API request failed: ${errorText}`);
        }

        const data = await response.json();
        reply = data.message?.content?.[0]?.text || "No response generated";
      } else {
        // Groq and DeepSeek use OpenAI-compatible format
        response = await fetch(externalApiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${externalApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: aiModel,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
            ],
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${model} API error:`, response.status, errorText);
          throw new Error(`${model} API request failed: ${errorText}`);
        }

        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || "No response generated";
      }
    } else {
      // Lovable AI Gateway for other models
      const requestBody: any = {
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      };

      // Use max_completion_tokens for OpenAI GPT-5+ models, max_tokens for others
      if (aiModel.includes('gpt-5') || aiModel.includes('gpt-4.1') || aiModel.includes('o3') || aiModel.includes('o4')) {
        requestBody.max_completion_tokens = 500;
      } else {
        requestBody.max_tokens = 500;
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Out of Lovable AI credits! Please add credits in Settings → Workspace → Usage to continue using ASKIFY." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`Lovable AI request failed: ${errorText}`);
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
