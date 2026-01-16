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

    const { messages, model, mode, image } = requestBody;

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
      if (typeof msg.content !== 'string') {
        return new Response(JSON.stringify({ error: "Message content must be a string" }), {
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

    // Require either message content or image
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content.length === 0 && !image) {
      return new Response(JSON.stringify({ error: "Message content or image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If image is attached, use vision model
    const hasImage = !!image;

    // Validate optional mode
    const validModes = ['normal', 'deepthink', 'search', 'reasoning'];
    if (mode && !validModes.includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // API Keys
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const POLLINATIONS_API_KEY_1 = Deno.env.get("POLLINATIONS_API_KEY_1");
    const POLLINATIONS_API_KEY_2 = Deno.env.get("POLLINATIONS_API_KEY_2");
    
    // Initialize Supabase client first
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
    
    // System prompt with staff information
    let systemPrompt = `You are ASKIFY, a helpful AI assistant. 

STAFF INFORMATION (only share when asked about owner, founder, CEO, staff, creator, or who made you):
- Owner/Founder: Mr. Rudra (also known as Rushi)
- CEO: Mr. Naitik
- Admin: Mr. Devanshu

When asked who made you, created you, or who is behind Askify, mention Mr. Rudra as the founder/owner.`;

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
    
    // Helper function to call Pollinations API - ONLY for DeepSeek Lite fallback
    async function callPollinationsWithKey1(messages: any[], systemPrompt: string, pollinationsModel: string): Promise<string> {
      if (!POLLINATIONS_API_KEY_1) {
        throw new Error("Pollinations Key 1 not available");
      }
      
      console.log(`Trying Pollinations API Key 1 with model: ${pollinationsModel}...`);
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POLLINATIONS_API_KEY_1}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: pollinationsModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response generated";
      }
      
      const errorText = await response.text();
      console.log(`Pollinations Key 1 failed with status ${response.status}: ${errorText}`);
      throw new Error(`Pollinations Key 1 expired or failed (resets in 24h)`);
    }
    
    async function callPollinationsWithKey2(messages: any[], systemPrompt: string, pollinationsModel: string): Promise<string> {
      if (!POLLINATIONS_API_KEY_2) {
        throw new Error("Pollinations Key 2 not available");
      }
      
      console.log(`Trying Pollinations API Key 2 with model: ${pollinationsModel}...`);
      const response = await fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POLLINATIONS_API_KEY_2}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: pollinationsModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No response generated";
      }
      
      const errorText = await response.text();
      console.log(`Pollinations Key 2 failed with status ${response.status}: ${errorText}`);
      throw new Error(`Pollinations Key 2 expired or failed (resets in 24h)`);
    }
    
    // Pollinations fallback chain - ONLY used for DeepSeek Lite model
    async function callPollinationsFallbackOnly(messages: any[], systemPrompt: string, pollinationsModel: string = 'deepseek'): Promise<string> {
      // Try Pollinations Key 1 first
      if (POLLINATIONS_API_KEY_1) {
        try {
          return await callPollinationsWithKey1(messages, systemPrompt, pollinationsModel);
        } catch (err) {
          console.log("Pollinations Key 1 failed, trying Key 2...", err);
        }
      }
      
      // Try Pollinations Key 2 as fallback
      if (POLLINATIONS_API_KEY_2) {
        try {
          return await callPollinationsWithKey2(messages, systemPrompt, pollinationsModel);
        } catch (err) {
          console.log("Pollinations Key 2 also failed...", err);
        }
      }
      
      throw new Error("Both Pollinations keys expired. They reset every 24 hours.");
    }
    
    // Map user's model selection to AI models
    // PRO and CORE models use their native APIs - NO POLLINATIONS FALLBACK
    // Only LITE (DeepSeek) uses Pollinations as fallback
    let aiModel = '';
    let useExternalApi = false;
    let externalApiUrl = '';
    let externalApiKey = '';
    let isLiteModel = false; // Only Lite models get Pollinations fallback
    let usePollinationsDirectly = false;
    let pollinationsModel = '';
    
    // Model mapping - Separated into tiers
    if (model === 'grok' || !model) {
      // CORE - Groq API (NO fallback)
      useExternalApi = true;
      externalApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      externalApiKey = Deno.env.get('GROQ_API_KEY') || '';
      aiModel = 'llama-3.3-70b-versatile';
    } else if (model === 'cohere') {
      // PRO - Cohere API (NO fallback)
      useExternalApi = true;
      externalApiUrl = 'https://api.cohere.ai/v2/chat';
      externalApiKey = Deno.env.get('COHERE_API_KEY') || '';
      aiModel = 'command-r-08-2024';
    } else if (model === 'deepseek') {
      // LITE - DeepSeek API with Pollinations fallback
      useExternalApi = true;
      externalApiUrl = 'https://api.deepseek.com/chat/completions';
      externalApiKey = Deno.env.get('DEEPSEEK_API_KEY') || '';
      aiModel = 'deepseek-chat';
      isLiteModel = true; // This is the only model that gets Pollinations fallback
    } else if (model === 'deepseek-v3') {
      // LITE - Uses Pollinations directly
      usePollinationsDirectly = true;
      pollinationsModel = 'deepseek';
      isLiteModel = true;
    } else if (model === 'gpt') {
      aiModel = 'openai/gpt-5';
    } else if (model === 'gpt-mini') {
      aiModel = 'openai/gpt-5-mini';
    } else if (model === 'gpt-nano') {
      aiModel = 'openai/gpt-5-nano';
    } else if (model === 'gpt-5.2') {
      // Uses Pollinations for specific features but NOT as fallback
      usePollinationsDirectly = true;
      pollinationsModel = 'openai';
    } else if (model === 'gpt-4o-audio') {
      usePollinationsDirectly = true;
      pollinationsModel = 'openai';
    } else if (model === 'gemini') {
      aiModel = 'google/gemini-2.5-flash';
    } else if (model === 'gemini-lite') {
      aiModel = 'google/gemini-2.5-flash-lite';
    } else if (model === 'gemini-3') {
      aiModel = 'google/gemini-3-pro-preview';
    } else if (model === 'gemini-3-flash') {
      usePollinationsDirectly = true;
      pollinationsModel = 'gemini';
    } else if (model === 'nano-banana') {
      aiModel = 'google/gemini-2.5-flash-image-preview';
    } else if (model === 'askify') {
      aiModel = 'google/gemini-2.5-pro';
    } else if (model === 'qwen-coder') {
      usePollinationsDirectly = true;
      pollinationsModel = 'qwen-coder';
    } else if (model === 'mistral-small') {
      usePollinationsDirectly = true;
      pollinationsModel = 'mistral';
    } else if (model === 'grok-4-fast') {
      usePollinationsDirectly = true;
      pollinationsModel = 'openai';
    } else if (model === 'claude-haiku') {
      usePollinationsDirectly = true;
      pollinationsModel = 'claude-haiku';
    } else if (model === 'claude-sonnet') {
      usePollinationsDirectly = true;
      pollinationsModel = 'claude-sonnet';
    } else if (model === 'claude-opus') {
      usePollinationsDirectly = true;
      pollinationsModel = 'claude-opus';
    } else if (model === 'perplexity-sonar') {
      usePollinationsDirectly = true;
      pollinationsModel = 'searchgpt';
    } else if (model === 'perplexity-reasoning') {
      usePollinationsDirectly = true;
      pollinationsModel = 'searchgpt';
    } else if (model === 'kimi-k2') {
      usePollinationsDirectly = true;
      pollinationsModel = 'mistral';
    } else if (model === 'nova-micro') {
      usePollinationsDirectly = true;
      pollinationsModel = 'openai';
    } else if (model === 'chicky-tutor') {
      aiModel = 'google/gemini-2.5-flash';
    } else if (model === 'midijourney') {
      aiModel = 'google/gemini-2.5-flash-image-preview';
    }
    
    // If an image is attached, force a vision-capable model
    if (hasImage) {
      console.log("Image provided; forcing vision-capable model");
      aiModel = 'google/gemini-2.5-flash';
      useExternalApi = false;
      externalApiUrl = '';
      externalApiKey = '';
      usePollinationsDirectly = false;
      pollinationsModel = '';
      isLiteModel = false;
    }

    // If using Pollinations model directly (for specific models, NOT as fallback)
    if (usePollinationsDirectly && (POLLINATIONS_API_KEY_1 || POLLINATIONS_API_KEY_2)) {
      try {
        const reply = await callPollinationsFallbackOnly(messages, systemPrompt, pollinationsModel);
        
        // Log usage
        await supabase.from('usage_logs').insert({
          user_id: user.id,
          model_id: `pollinations-${pollinationsModel}`,
          mode: mode || 'normal'
        });

        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (pollError) {
        console.error("Pollinations models failed:", pollError);
        return new Response(JSON.stringify({ error: "This model is currently unavailable. Please try again later or use a different model." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check model access permission (skip for external API and Pollinations models)
    if (!useExternalApi && !usePollinationsDirectly && aiModel) {
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

    let reply = '';

    // Handle external API calls (Groq/Core, Cohere/Pro, DeepSeek/Lite)
    if (useExternalApi) {
      if (!externalApiKey) {
        // If external API key not configured
        if (isLiteModel) {
          // ONLY DeepSeek Lite can fallback to Pollinations
          console.log(`DeepSeek API key not configured, using Pollinations fallback...`);
          try {
            reply = await callPollinationsFallbackOnly(messages, systemPrompt, 'deepseek');
            await supabase.from('usage_logs').insert({
              user_id: user.id,
              model_id: 'pollinations-deepseek-fallback',
              mode: mode || 'normal'
            });
            return new Response(JSON.stringify({ reply }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (err) {
            return new Response(JSON.stringify({ error: "DeepSeek Lite is currently unavailable. Please try again later." }), {
              status: 503,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          // PRO and CORE models - NO FALLBACK
          return new Response(JSON.stringify({ error: `${model === 'cohere' ? 'Pro' : 'Core'} model is currently unavailable. API key not configured.` }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      let response;
      
      try {
        if (model === 'cohere') {
          // Cohere v2 API format (PRO - no fallback)
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
            console.error(`Cohere API error: ${response.status} - ${errorText}`);
            // PRO model - NO FALLBACK
            return new Response(JSON.stringify({ error: "Pro model (Cohere) is currently unavailable. Please try again later." }), {
              status: 503,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const data = await response.json();
          reply = data.message?.content?.[0]?.text || "No response generated";
        } else {
          // Groq (CORE) and DeepSeek (LITE) use OpenAI-compatible format
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
            console.error(`${model} API error: ${response.status} - ${errorText}`);
            
            // Only DeepSeek (LITE) can fallback to Pollinations
            if (isLiteModel) {
              console.log("DeepSeek API failed, trying Pollinations fallback...");
              try {
                reply = await callPollinationsFallbackOnly(messages, systemPrompt, 'deepseek');
                await supabase.from('usage_logs').insert({
                  user_id: user.id,
                  model_id: 'pollinations-deepseek-fallback',
                  mode: mode || 'normal'
                });
                return new Response(JSON.stringify({ reply }), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              } catch (fallbackErr) {
                return new Response(JSON.stringify({ error: "DeepSeek Lite is currently unavailable. Please try again later." }), {
                  status: 503,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            } else {
              // CORE (Groq) - NO FALLBACK
              return new Response(JSON.stringify({ error: "Core model (Groq) is currently unavailable. Please try again later." }), {
                status: 503,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }

          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || "No response generated";
        }
      } catch (error) {
        console.error(`External API (${model}) failed:`, error);
        
        // Only DeepSeek (LITE) can fallback to Pollinations
        if (isLiteModel) {
          console.log("DeepSeek API failed, trying Pollinations fallback...");
          try {
            reply = await callPollinationsFallbackOnly(messages, systemPrompt, 'deepseek');
            await supabase.from('usage_logs').insert({
              user_id: user.id,
              model_id: 'pollinations-deepseek-fallback',
              mode: mode || 'normal'
            });
            return new Response(JSON.stringify({ reply }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } catch (fallbackErr) {
            return new Response(JSON.stringify({ error: "DeepSeek Lite is currently unavailable. Please try again later." }), {
              status: 503,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          // PRO and CORE - NO FALLBACK
          const tierName = model === 'cohere' ? 'Pro' : 'Core';
          return new Response(JSON.stringify({ error: `${tierName} model is currently unavailable. Please try again later.` }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else {
      // For Lovable AI models (Gemini, GPT, etc.)
      let processedMessages = messages;
      let modelToUse = aiModel;
      
      if (hasImage && image) {
        console.log("Image attached, using Lovable vision model");
        modelToUse = 'google/gemini-2.5-flash';
        
        // Add image to the last user message
        const lastUserMsgIndex = messages.length - 1;
        processedMessages = messages.map((msg: any, i: number) => {
          if (i === lastUserMsgIndex && msg.role === 'user') {
            const textContent = msg.content.trim() || "What's in this image? Please analyze it.";
            return {
              role: 'user',
              content: [
                { type: 'text', text: textContent },
                { type: 'image_url', image_url: { url: image } }
              ]
            };
          }
          return msg;
        });
      }
      
      const requestBody: any = {
        model: modelToUse,
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
      };

      // Use max_completion_tokens for OpenAI GPT-5+ models
      if (aiModel.includes('gpt-5') || aiModel.includes('gpt-4.1') || aiModel.includes('o3') || aiModel.includes('o4')) {
        requestBody.max_completion_tokens = 500;
      } else {
        requestBody.max_tokens = 500;
      }

      try {
        if (!LOVABLE_API_KEY) {
          throw new Error("Lovable API key not configured");
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
            return new Response(JSON.stringify({ error: "Out of AI credits. Please go to Settings → Workspace → Usage to add credits." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          throw new Error(`Lovable AI request failed: ${errorText}`);
        } else {
          const data = await response.json();
          reply = data.choices?.[0]?.message?.content || "No response generated";
        }
      } catch (error) {
        console.error("Lovable AI error:", error);
        return new Response(JSON.stringify({ error: "AI service is currently unavailable. Please try again later." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      model_id: aiModel || model,
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
