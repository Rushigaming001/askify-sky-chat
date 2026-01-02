import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [videoModel, setVideoModel] = useState('luma');
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setGeneratedVideo(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('video-ai', {
        body: { prompt, videoModel }
      });

      if (error) throw error;

      if (data.output) {
        setGeneratedVideo(data.output);
        toast({
          title: 'Success',
          description: 'Video generated successfully!'
        });
      }
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate video. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = 'askify-generated-video.mp4';
    link.target = '_blank';
    link.click();
  };

  const handleClose = () => {
    setGeneratedVideo(null);
    setPrompt('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            AI Video Generator
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-prompt">Video Prompt</Label>
          <Input
            id="video-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A person walking through a futuristic city..."
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-model">Model</Label>
          <Select value={videoModel} onValueChange={setVideoModel} disabled={loading}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="luma">Luma Ray (Default)</SelectItem>
              <SelectItem value="pollinations">Pollinations AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt.trim()} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Video... (This may take 2-5 minutes)
            </>
          ) : (
            'Generate Video'
          )}
        </Button>

        {generatedVideo && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-border">
              <video 
                src={generatedVideo} 
                controls 
                className="w-full h-auto"
              />
            </div>
            <Button onClick={handleDownload} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
