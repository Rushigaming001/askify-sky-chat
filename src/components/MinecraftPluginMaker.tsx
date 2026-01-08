import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Package, Blocks, Box, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRestrictions } from "@/hooks/useUserRestrictions";

const MinecraftPluginMaker = () => {
  const [creationType, setCreationType] = useState<"plugin" | "mod" | "addon">("plugin");
  const [pluginName, setPluginName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.20.1");
  const [serverType, setServerType] = useState("paper");
  const [modLoader, setModLoader] = useState("fabric");
  const [addonType, setAddonType] = useState("behavior");
  const [commands, setCommands] = useState("");
  const [functionality, setFunctionality] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { restrictions } = useUserRestrictions();

  // Check if user is restricted from minecraft plugin maker
  if (restrictions.minecraft_plugin_disabled) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have been restricted from using Minecraft Plugin Maker. Contact an admin for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  const handleGenerate = async () => {
    if (!pluginName || !description || !functionality) {
      toast({
        title: "Missing Information",
        description: `Please fill in ${creationType} name, description, and functionality.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setDownloadUrl("");

    try {
      const bodyData: any = {
        name: pluginName,
        description,
        version,
        commands: commands.split('\n').filter(cmd => cmd.trim()),
        functionality,
        creationType
      };

      if (creationType === "plugin") {
        bodyData.serverType = serverType;
      } else if (creationType === "mod") {
        bodyData.modLoader = modLoader;
      } else if (creationType === "addon") {
        bodyData.addonType = addonType;
      }

      const { data, error } = await supabase.functions.invoke('minecraft-plugin', {
        body: bodyData
      });

      if (error) throw error;

      // Create blob from base64 data and trigger download
      const byteCharacters = atob(data.fileBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      let mimeType = 'application/java-archive';
      let fileExt = '.jar';
      
      if (creationType === "addon") {
        mimeType = 'application/zip';
        fileExt = addonType === "behavior" ? '.mcpack' : addonType === "resource" ? '.mcpack' : '.mcaddon';
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      
      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pluginName || 'Creation'}${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: `${creationType.charAt(0).toUpperCase() + creationType.slice(1)} Generated!`,
        description: `Your file is downloading now.`,
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || `Failed to generate ${creationType}.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAgain = () => {
    if (downloadUrl) {
      let fileExt = '.jar';
      if (creationType === "addon") {
        fileExt = addonType === "behavior" ? '.mcpack' : addonType === "resource" ? '.mcpack' : '.mcaddon';
      }
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${pluginName || 'Creation'}${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-6 w-6" />
            Minecraft Creator Studio
          </CardTitle>
          <CardDescription>
            Generate custom plugins, mods, and addons for Minecraft Java & Bedrock Edition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={creationType} onValueChange={(v) => setCreationType(v as "plugin" | "mod" | "addon")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="plugin" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Plugin
              </TabsTrigger>
              <TabsTrigger value="mod" className="flex items-center gap-2">
                <Blocks className="h-4 w-4" />
                Mod
              </TabsTrigger>
              <TabsTrigger value="addon" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Addon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plugin" className="space-y-4 mt-6">
              {renderCommonFields()}
              <div className="space-y-2">
                <Label htmlFor="serverType">Server Software</Label>
                <Select value={serverType} onValueChange={setServerType}>
                  <SelectTrigger id="serverType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="spigot">Spigot</SelectItem>
                    <SelectItem value="bukkit">Bukkit</SelectItem>
                    <SelectItem value="purpur">Purpur</SelectItem>
                    <SelectItem value="airplane">Airplane</SelectItem>
                    <SelectItem value="pufferfish">Pufferfish</SelectItem>
                    <SelectItem value="folia">Folia</SelectItem>
                    <SelectItem value="velocity">Velocity (Proxy)</SelectItem>
                    <SelectItem value="waterfall">Waterfall (Proxy)</SelectItem>
                    <SelectItem value="bungeecord">BungeeCord (Proxy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderCommandsAndGenerate()}
            </TabsContent>

            <TabsContent value="mod" className="space-y-4 mt-6">
              {renderCommonFields()}
              <div className="space-y-2">
                <Label htmlFor="modLoader">Mod Loader</Label>
                <Select value={modLoader} onValueChange={setModLoader}>
                  <SelectTrigger id="modLoader">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="forge">Forge</SelectItem>
                    <SelectItem value="neoforge">NeoForge</SelectItem>
                    <SelectItem value="quilt">Quilt</SelectItem>
                    <SelectItem value="sponge">Sponge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderCommandsAndGenerate()}
            </TabsContent>

            <TabsContent value="addon" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="addonName">Addon Name</Label>
                <Input
                  id="addonName"
                  placeholder="MyAwesomeAddon"
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addonDescription">Description</Label>
                <Input
                  id="addonDescription"
                  placeholder="A Bedrock addon that does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrockVersion">Bedrock Version</Label>
                  <Select value={version} onValueChange={setVersion}>
                    <SelectTrigger id="bedrockVersion">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="1.21.50">1.21.50</SelectItem>
                      <SelectItem value="1.21.40">1.21.40</SelectItem>
                      <SelectItem value="1.21.30">1.21.30</SelectItem>
                      <SelectItem value="1.21.20">1.21.20</SelectItem>
                      <SelectItem value="1.21.10">1.21.10</SelectItem>
                      <SelectItem value="1.21.0">1.21.0</SelectItem>
                      <SelectItem value="1.20.80">1.20.80</SelectItem>
                      <SelectItem value="1.20.70">1.20.70</SelectItem>
                      <SelectItem value="1.20.60">1.20.60</SelectItem>
                      <SelectItem value="1.20.50">1.20.50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addonType">Addon Type</Label>
                  <Select value={addonType} onValueChange={setAddonType}>
                    <SelectTrigger id="addonType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavior">Behavior Pack</SelectItem>
                      <SelectItem value="resource">Resource Pack</SelectItem>
                      <SelectItem value="combined">Combined Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addonFunctionality">Functionality Details</Label>
                <Textarea
                  id="addonFunctionality"
                  placeholder="Describe what your addon should do: custom items, mobs, blocks, textures, sounds, etc."
                  value={functionality}
                  onChange={(e) => setFunctionality(e.target.value)}
                  rows={5}
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
                    Generating Addon...
                  </>
                ) : (
                  "Generate Bedrock Addon"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {downloadUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {creationType.charAt(0).toUpperCase() + creationType.slice(1)} Ready
              <Button onClick={handleDownloadAgain} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Again
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {creationType === "plugin" && "Your plugin file has been generated. Upload it to your server's plugins folder and restart."}
              {creationType === "mod" && "Your mod file has been generated. Place it in your mods folder and launch the game."}
              {creationType === "addon" && "Your addon has been generated. Import it in Minecraft Bedrock Edition."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  function renderCommonFields() {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder={`My${creationType.charAt(0).toUpperCase() + creationType.slice(1)}`}
            value={pluginName}
            onChange={(e) => setPluginName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder={`A ${creationType} that does...`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

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
      </>
    );
  }

  function renderCommandsAndGenerate() {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="commands">Commands (one per line, optional)</Label>
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
            placeholder={`Describe what your ${creationType} should do, how it works, features, etc.`}
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
              Generating {creationType.charAt(0).toUpperCase() + creationType.slice(1)}...
            </>
          ) : (
            `Generate ${creationType.charAt(0).toUpperCase() + creationType.slice(1)}`
          )}
        </Button>
      </>
    );
  }
};

export default MinecraftPluginMaker;
