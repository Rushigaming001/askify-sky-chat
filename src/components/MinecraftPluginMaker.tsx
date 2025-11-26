import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MinecraftPluginMaker = () => {
  const [pluginName, setPluginName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.20.1");
  const [serverType, setServerType] = useState("paper");
  const [commands, setCommands] = useState("");
  const [functionality, setFunctionality] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!pluginName || !description || !functionality) {
      toast({
        title: "Missing Information",
        description: "Please fill in plugin name, description, and functionality.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedCode("");

    try {
      const { data, error } = await supabase.functions.invoke('minecraft-plugin', {
        body: {
          pluginName,
          description,
          version,
          serverType,
          commands: commands.split('\n').filter(cmd => cmd.trim()),
          functionality
        }
      });

      if (error) throw error;

      setGeneratedCode(data.code);
      toast({
        title: "Plugin Generated!",
        description: "Your Minecraft plugin code is ready.",
      });
    } catch (error: any) {
      console.error('Plugin generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate plugin code.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pluginName || 'Plugin'}.java`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Minecraft Plugin Maker
          </CardTitle>
          <CardDescription>
            Generate custom Minecraft plugins with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pluginName">Plugin Name</Label>
            <Input
              id="pluginName"
              placeholder="MyAwesomePlugin"
              value={pluginName}
              onChange={(e) => setPluginName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Input
              id="description"
              placeholder="A plugin that does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="version">Minecraft Version</Label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger id="version">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.20.1">1.20.1</SelectItem>
                  <SelectItem value="1.19.4">1.19.4</SelectItem>
                  <SelectItem value="1.18.2">1.18.2</SelectItem>
                  <SelectItem value="1.17.1">1.17.1</SelectItem>
                  <SelectItem value="1.16.5">1.16.5</SelectItem>
                  <SelectItem value="1.12.2">1.12.2</SelectItem>
                  <SelectItem value="1.8.8">1.8.8</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serverType">Server Software</Label>
              <Select value={serverType} onValueChange={setServerType}>
                <SelectTrigger id="serverType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paper">Paper</SelectItem>
                  <SelectItem value="spigot">Spigot</SelectItem>
                  <SelectItem value="bukkit">Bukkit</SelectItem>
                  <SelectItem value="velocity">Velocity (Proxy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commands">Commands (one per line)</Label>
            <Textarea
              id="commands"
              placeholder="/heal - Heals the player&#10;/fly - Toggles flight mode"
              value={commands}
              onChange={(e) => setCommands(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="functionality">Functionality Details</Label>
            <Textarea
              id="functionality"
              placeholder="Describe what your plugin should do, how it works, permissions, config options, etc."
              value={functionality}
              onChange={(e) => setFunctionality(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Plugin...
              </>
            ) : (
              "Generate Plugin Code"
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Code
              <Button onClick={handleDownload} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{generatedCode}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinecraftPluginMaker;
