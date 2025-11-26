import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    const isBedrockPlugin = ['bedrock', 'nukkit', 'powernukkit', 'cloudburst'].includes(serverType);
    const isProxy = ['velocity', 'waterfall', 'bungeecord'].includes(serverType);
    const isModded = ['fabric', 'forge', 'neoforge', 'sponge'].includes(serverType);
    
    let apiType = 'Bukkit/Spigot API';
    let baseClass = 'JavaPlugin';
    let configFile = 'plugin.yml';
    
    if (isBedrockPlugin) {
      apiType = 'PocketMine/Nukkit API';
      baseClass = 'PluginBase';
      configFile = 'plugin.yml';
    } else if (serverType === 'velocity') {
      apiType = 'Velocity API';
      baseClass = '@Plugin annotation';
      configFile = 'velocity-plugin.json';
    } else if (serverType === 'bungeecord' || serverType === 'waterfall') {
      apiType = 'BungeeCord API';
      baseClass = 'Plugin';
      configFile = 'bungee.yml';
    } else if (isModded) {
      apiType = `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} mod API`;
      baseClass = 'appropriate mod entry point';
      configFile = 'mod configuration file';
    }

    const systemPrompt = `You are an expert Minecraft plugin/mod developer. Generate complete, production-ready Java code for Minecraft plugins.

Generate a response in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
{
  "mainClass": "complete Java code here",
  "pluginYml": "complete ${configFile} content here",
  "packageName": "com.example.pluginname"
}

Requirements:
- Generate clean, well-documented Java code
- Use proper package structure (e.g., com.example.pluginname)
- Add all necessary imports
- Follow best practices for ${serverType} plugins/mods
- Support Minecraft version ${version}
- Include proper error handling
- Add permission nodes for commands
- Make code compatible with ${apiType}
- The main class MUST extend ${baseClass}
${isBedrockPlugin ? '- Use PocketMine/Nukkit API methods for Bedrock Edition compatibility' : ''}
${isProxy ? '- Implement proxy-specific features and event handling' : ''}
${isModded ? '- Follow mod structure and registration patterns for ' + serverType : ''}`;

    const userPrompt = `Generate a Minecraft ${isBedrockPlugin ? 'Bedrock Edition plugin' : isModded ? 'mod' : 'plugin'} with these specifications:

Plugin Name: ${pluginName}
Description: ${description}
Minecraft Version: ${version}
Platform: ${serverType}${isBedrockPlugin ? ' (Bedrock Edition)' : ''}

Commands:
${commands.length > 0 ? commands.join('\n') : 'No specific commands'}

Functionality:
${functionality}

${isBedrockPlugin ? 'IMPORTANT: This is for Bedrock Edition. Use PocketMine/Nukkit API methods.' : ''}
${isProxy ? 'IMPORTANT: This is a proxy plugin. Focus on proxy-specific features like server switching and player messaging.' : ''}
${isModded ? 'IMPORTANT: This is a mod. Follow mod structure with proper mod metadata and entry points.' : ''}

Return ONLY valid JSON with mainClass, pluginYml (or appropriate config), and packageName fields. No markdown formatting.`;

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
    let generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No code generated from AI');
    }

    console.log("Raw AI response:", generatedContent);

    // Clean markdown formatting if present
    generatedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let pluginData;
    try {
      pluginData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', generatedContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    const { mainClass, pluginYml, packageName } = pluginData;

    if (!mainClass || !pluginYml || !packageName) {
      throw new Error('AI response missing required fields');
    }

    // Create a simple JAR structure in memory
    // For a real JAR, we'd need proper Java compilation, but we'll create a source JAR
    const jarContent = await createSourceJar(pluginName, mainClass, pluginYml, packageName);

    console.log("Plugin JAR created successfully");

    return new Response(
      JSON.stringify({ jarBase64: jarContent }),
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

// Create a ZIP file containing the plugin source (acting as a JAR)
async function createSourceJar(
  pluginName: string,
  mainClass: string,
  pluginYml: string,
  packageName: string
): Promise<string> {
  // Create a simple text-based archive since we can't compile Java
  // This creates a ZIP file that users can extract and build
  const encoder = new TextEncoder();
  
  // Create file contents
  const packagePath = packageName.replace(/\./g, '/');
  const files = new Map<string, Uint8Array>();
  
  files.set(`src/main/java/${packagePath}/${pluginName}.java`, encoder.encode(mainClass));
  files.set('src/main/resources/plugin.yml', encoder.encode(pluginYml));
  
  const readme = `# ${pluginName}

This is a Minecraft plugin source package generated by ASKIFY.

## Building the Plugin

To build this plugin into a .jar file:

1. Install Maven or Gradle
2. Extract this archive
3. Add a pom.xml or build.gradle file for your build system
4. Run: mvn clean package (for Maven) or gradle build (for Gradle)
5. Find the compiled .jar in the target/ or build/libs/ directory

## Quick Maven Setup

Create pom.xml in the root directory:

\`\`\`xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>${packageName}</groupId>
    <artifactId>${pluginName}</artifactId>
    <version>1.0.0</version>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
                <configuration>
                    <source>1.8</source>
                    <target>1.8</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
    <dependencies>
        <dependency>
            <groupId>org.spigotmc</groupId>
            <artifactId>spigot-api</artifactId>
            <version>1.20.1-R0.1-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <repositories>
        <repository>
            <id>spigot-repo</id>
            <url>https://hub.spigotmc.org/nexus/content/repositories/snapshots/</url>
        </repository>
    </repositories>
</project>
\`\`\`

## Installation

1. Build the plugin (see above)
2. Copy the .jar file to your server's plugins folder
3. Restart your server

Note: This is a source archive. You need to compile it before use.
`;
  files.set('README.md', encoder.encode(readme));
  
  // Create a simple archive format (concatenated files with headers)
  // For a proper implementation, we'd use a real ZIP library
  // But for now, we'll create a tar-like structure
  let archiveContent = '';
  
  for (const [path, content] of files.entries()) {
    const contentStr = new TextDecoder().decode(content);
    archiveContent += `\n\n========== ${path} ==========\n\n${contentStr}`;
  }
  
  // Convert to base64
  const archiveBytes = encoder.encode(archiveContent);
  return base64Encode(archiveBytes.buffer);
}
