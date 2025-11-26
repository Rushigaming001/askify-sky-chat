import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MinecraftPluginMaker = () => {
  const [pluginName, setPluginName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.20.1");
  const [serverType, setServerType] = useState("paper");
  const [commands, setCommands] = useState("");
  const [functionality, setFunctionality] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
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
    setDownloadUrl("");

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

      // Create blob from base64 data and trigger download
      const byteCharacters = atob(data.jarBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/java-archive' });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      
      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pluginName || 'Plugin'}.jar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Plugin Generated!",
        description: "Your .jar file is downloading now.",
      });
    } catch (error: any) {
      console.error('Plugin generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate plugin.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAgain = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${pluginName || 'Plugin'}.jar`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Minecraft Plugin Maker</CardTitle>
          <CardDescription>
            Generate custom Minecraft plugins as downloadable .jar files
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
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="1.21.10">1.21.10</SelectItem>
                  <SelectItem value="1.21.4">1.21.4</SelectItem>
                  <SelectItem value="1.21.3">1.21.3</SelectItem>
                  <SelectItem value="1.21.2">1.21.2</SelectItem>
                  <SelectItem value="1.21.1">1.21.1</SelectItem>
                  <SelectItem value="1.21">1.21</SelectItem>
                  <SelectItem value="1.20.6">1.20.6</SelectItem>
                  <SelectItem value="1.20.5">1.20.5</SelectItem>
                  <SelectItem value="1.20.4">1.20.4</SelectItem>
                  <SelectItem value="1.20.3">1.20.3</SelectItem>
                  <SelectItem value="1.20.2">1.20.2</SelectItem>
                  <SelectItem value="1.20.1">1.20.1</SelectItem>
                  <SelectItem value="1.20">1.20</SelectItem>
                  <SelectItem value="1.19.4">1.19.4</SelectItem>
                  <SelectItem value="1.19.3">1.19.3</SelectItem>
                  <SelectItem value="1.19.2">1.19.2</SelectItem>
                  <SelectItem value="1.19.1">1.19.1</SelectItem>
                  <SelectItem value="1.19">1.19</SelectItem>
                  <SelectItem value="1.18.2">1.18.2</SelectItem>
                  <SelectItem value="1.18.1">1.18.1</SelectItem>
                  <SelectItem value="1.18">1.18</SelectItem>
                  <SelectItem value="1.17.1">1.17.1</SelectItem>
                  <SelectItem value="1.17">1.17</SelectItem>
                  <SelectItem value="1.16.5">1.16.5</SelectItem>
                  <SelectItem value="1.16.4">1.16.4</SelectItem>
                  <SelectItem value="1.16.3">1.16.3</SelectItem>
                  <SelectItem value="1.16.2">1.16.2</SelectItem>
                  <SelectItem value="1.16.1">1.16.1</SelectItem>
                  <SelectItem value="1.16">1.16</SelectItem>
                  <SelectItem value="1.15.2">1.15.2</SelectItem>
                  <SelectItem value="1.15.1">1.15.1</SelectItem>
                  <SelectItem value="1.15">1.15</SelectItem>
                  <SelectItem value="1.14.4">1.14.4</SelectItem>
                  <SelectItem value="1.14.3">1.14.3</SelectItem>
                  <SelectItem value="1.14.2">1.14.2</SelectItem>
                  <SelectItem value="1.14.1">1.14.1</SelectItem>
                  <SelectItem value="1.14">1.14</SelectItem>
                  <SelectItem value="1.13.2">1.13.2</SelectItem>
                  <SelectItem value="1.13.1">1.13.1</SelectItem>
                  <SelectItem value="1.13">1.13</SelectItem>
                  <SelectItem value="1.12.2">1.12.2</SelectItem>
                  <SelectItem value="1.12.1">1.12.1</SelectItem>
                  <SelectItem value="1.12">1.12</SelectItem>
                  <SelectItem value="1.11.2">1.11.2</SelectItem>
                  <SelectItem value="1.11">1.11</SelectItem>
                  <SelectItem value="1.10.2">1.10.2</SelectItem>
                  <SelectItem value="1.10">1.10</SelectItem>
                  <SelectItem value="1.9.4">1.9.4</SelectItem>
                  <SelectItem value="1.9.2">1.9.2</SelectItem>
                  <SelectItem value="1.9">1.9</SelectItem>
                  <SelectItem value="1.8.9">1.8.9</SelectItem>
                  <SelectItem value="1.8.8">1.8.8</SelectItem>
                  <SelectItem value="1.8">1.8</SelectItem>
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

      {downloadUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Plugin Ready
              <Button onClick={handleDownloadAgain} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Again
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your plugin .jar file has been generated and downloaded. You can upload it to your server's plugins folder and restart the server.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MinecraftPluginMaker;
