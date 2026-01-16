import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Video, FileText, Download, Copy, BookOpen, Sparkles, Lock, AlertCircle, Volume2, Play, Pause, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ChapterVideoGenerator() {
  const [chapterText, setChapterText] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [useLovableAI, setUseLovableAI] = useState(false);
  const [language, setLanguage] = useState<'english' | 'hindi'>('english');
  const [loading, setLoading] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>('');
  const [usedVoice, setUsedVoice] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
    setAudioData(null);
    setIsPlaying(false);

    try {
      const { data, error } = await supabase.functions.invoke('chapter-video', {
        body: { 
          chapterText: chapterText.trim(),
          chapterTitle: chapterTitle.trim() || 'Chapter Explanation',
          useLovableAI: isOwner && useLovableAI,
          language
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedScript(data.script);
      setAudioData(data.audio);
      setUsedModel(data.model || 'unknown');
      setUsedVoice(data.voice || 'unknown');
      
      toast({
        title: data.audio ? '🎬 Video Audio Generated!' : '📝 Script Generated',
        description: data.audio 
          ? `Your chapter explanation is ready with ${data.voice} voice in ${data.language}`
          : 'Script generated but audio service is unavailable',
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate video content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioData) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(`data:audio/mpeg;base64,${audioData}`);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioData) return;
    
    const link = document.createElement('a');
    link.href = `data:audio/mpeg;base64,${audioData}`;
    link.download = `${chapterTitle || 'chapter'}-explanation-${language}.mp3`;
    link.click();
    
    toast({
      title: 'Downloaded!',
      description: 'Audio file downloaded successfully',
    });
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

  const handleDownloadScript = () => {
    if (generatedScript) {
      const blob = new Blob([generatedScript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chapterTitle || 'chapter'}-narration-${language}.txt`;
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
            Transform your chapter content into an engaging audio explanation with AI-generated voice narration
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

          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Voice Language</Label>
            <Select value={language} onValueChange={(val: 'english' | 'hindi') => setLanguage(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">🇬🇧 English</SelectItem>
                <SelectItem value="hindi">🇮🇳 Hindi (हिंदी)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The AI will generate the explanation in {language === 'hindi' ? 'Hindi' : 'English'} and create voice narration
            </p>
          </div>

          {/* Lovable AI Toggle - Only for Owner */}
          {isOwner && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label htmlFor="lovable-ai" className="font-medium">Use Gemini Pro</Label>
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
              Gemini Pro is only available for the owner. Using free AI model.
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
                Generating Audio Explanation...
              </>
            ) : (
              <>
                <Volume2 className="mr-2 h-4 w-4" />
                Generate Video with Voice
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Audio Player */}
      {audioData && (
        <Card className="border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-green-500" />
                Audio Explanation Ready
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Voice: {usedVoice}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {language === 'hindi' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-background border">
              <Button
                onClick={handlePlayPause}
                size="lg"
                className={isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Play Audio
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={handleDownloadAudio}>
                <Download className="h-4 w-4 mr-2" />
                Download MP3
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              💡 This audio can be used as voiceover for your video. Download and add it to any video editor!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Script */}
      {generatedScript && (
        <Card className="border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Narration Script
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Model: {usedModel}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] rounded-md border p-4 bg-background">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {generatedScript}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Example Output Preview */}
      {!generatedScript && !audioData && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-muted-foreground">How It Works</h3>
                <p className="text-sm text-muted-foreground/70">
                  Paste your chapter content and get:
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded bg-muted/50 flex flex-col items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span>AI Script</span>
                </div>
                <div className="p-3 rounded bg-muted/50 flex flex-col items-center gap-2">
                  <Volume2 className="h-5 w-5 text-green-500" />
                  <span>Voice Audio</span>
                </div>
                <div className="p-3 rounded bg-muted/50 flex flex-col items-center gap-2">
                  <span className="text-xl">🇬🇧🇮🇳</span>
                  <span>English/Hindi</span>
                </div>
                <div className="p-3 rounded bg-muted/50 flex flex-col items-center gap-2">
                  <Download className="h-5 w-5 text-purple-500" />
                  <span>Download MP3</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
