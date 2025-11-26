import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pluginName, description, version, serverType, commands, functionality } = await req.json();
    
    console.log("Generating Minecraft plugin:", { pluginName, version, serverType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert Minecraft plugin developer. Generate complete, production-ready Java code for Minecraft plugins.

Requirements:
- Generate clean, well-documented Java code
- Include proper package structure
- Add all necessary imports
- Include plugin.yml configuration
- Follow best practices for ${serverType} plugins
- Support Minecraft version ${version}
- Include proper error handling
- Add permission nodes for commands
- Make code compatible with ${serverType === 'velocity' ? 'Velocity proxy API' : 'Bukkit/Spigot API'}

Generate ONLY the Java code, no explanations. Include comments in the code itself.`;

    const userPrompt = `Generate a Minecraft plugin with these specifications:

Plugin Name: ${pluginName}
Description: ${description}
Minecraft Version: ${version}
Server Type: ${serverType}

Commands:
${commands.length > 0 ? commands.join('\n') : 'No specific commands'}

Functionality:
${functionality}

Generate the main plugin class and plugin.yml. Include all necessary code to make this plugin functional.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedCode = data.choices?.[0]?.message?.content;

    if (!generatedCode) {
      throw new Error('No code generated from AI');
    }

    console.log("Plugin code generated successfully");

    return new Response(
      JSON.stringify({ code: generatedCode }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in minecraft-plugin function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
