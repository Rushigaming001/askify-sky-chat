import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, FileText, Download, Copy, BookOpen, Sparkles, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ChapterVideoGenerator() {
  const [chapterText, setChapterText] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [useLovableAI, setUseLovableAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkOwnerRole = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase.rpc('is_owner', { _user_id: user.id });
      setIsOwner(data === true);
    };
    
    checkOwnerRole();
  }, [user?.id]);

  const handleGenerate = async () => {
    if (!chapterText.trim() || chapterText.trim().length < 50) {
      toast({
        title: 'Error',
        description: 'Please enter at least 50 characters of chapter content',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setGeneratedScript(null);

    try {
      const { data, error } = await supabase.functions.invoke('chapter-video', {
        body: { 
          chapterText: chapterText.trim(),
          chapterTitle: chapterTitle.trim() || 'Chapter Explanation',
          useLovableAI: isOwner && useLovableAI
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedScript(data.script);
      setUsedModel(data.model || 'unknown');
      
      toast({
        title: '🎬 Video Script Generated!',
        description: 'Your chapter explanation script is ready',
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate video script',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      toast({
        title: 'Copied!',
        description: 'Script copied to clipboard',
      });
    }
  };

  const handleDownload = () => {
    if (generatedScript) {
      const blob = new Blob([generatedScript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chapterTitle || 'chapter'}-video-script.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            AI Chapter Video Generator
          </CardTitle>
          <CardDescription>
            Transform your chapter content into an engaging video script with animations, dialogues, and scene descriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Chapter Title (Optional)</Label>
            <Input
              id="title"
              placeholder="e.g., My Financial Career - Class 9 English"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Chapter Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your chapter text here... (minimum 50 characters)

Example:
When I go into a bank I get rattled. The clerks rattle me; the wickets rattle me; the sight of the money rattles me; everything rattles me..."
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {chapterText.length} characters • Minimum 50 required
            </p>
          </div>

          {/* Lovable AI Toggle - Only for Owner */}
          {isOwner && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label htmlFor="lovable-ai" className="font-medium">Use Lovable AI Pro</Label>
                  <Badge variant="secondary" className="text-xs">Owner Only</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Higher quality output with Gemini Pro model
                </p>
              </div>
              <Switch
                id="lovable-ai"
                checked={useLovableAI}
                onCheckedChange={setUseLovableAI}
              />
            </div>
          )}

          {!isOwner && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Lovable AI Pro is only available for the owner. Using free AI model.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={loading || chapterText.trim().length < 50}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video Script...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Generate Video Script
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Script */}
      {generatedScript && (
        <Card className="border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Generated Video Script
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Model: {usedModel}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] rounded-md border p-4 bg-background">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {generatedScript}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Example Output Preview */}
      {!generatedScript && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-muted-foreground">Example Output</h3>
                <p className="text-sm text-muted-foreground/70">
                  Your generated script will include:
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-2 rounded bg-muted/50">📝 Scene Descriptions</div>
                <div className="p-2 rounded bg-muted/50">🎬 Visual Animations</div>
                <div className="p-2 rounded bg-muted/50">🗣️ Narrator Dialogue</div>
                <div className="p-2 rounded bg-muted/50">⏱️ Timing & Transitions</div>
                <div className="p-2 rounded bg-muted/50">📊 Key Concepts</div>
                <div className="p-2 rounded bg-muted/50">❓ Quiz Questions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}