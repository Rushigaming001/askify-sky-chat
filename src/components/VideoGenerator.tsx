import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const { toast } = useToast();

  const checkStatus = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('video-ai', {
        body: { predictionId: id }
      });

      if (error) throw error;

      if (data.status === 'succeeded') {
        setGeneratedVideo(data.output);
        setLoading(false);
        toast({
          title: 'Success',
          description: 'Video generated successfully!'
        });
      } else if (data.status === 'failed') {
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Video generation failed',
          variant: 'destructive'
        });
      } else {
        // Still processing, check again in 3 seconds
        setTimeout(() => checkStatus(id), 3000);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to check video status',
        variant: 'destructive'
      });
    }
  };

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
        body: { prompt }
      });

      if (error) throw error;

      if (data.predictionId) {
        setPredictionId(data.predictionId);
        checkStatus(data.predictionId);
      }
    } catch (error) {
      console.error('Error generating video:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to generate video',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    
    const link = document.createElement('a');
    link.href = generatedVideo;
    link.download = 'askify-generated-video.mp4';
    link.click();
  };

  const handleClose = () => {
    setGeneratedVideo(null);
    setPrompt('');
    setPredictionId(null);
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

        <Button 
          onClick={handleGenerate} 
          disabled={loading || !prompt.trim()} 
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Video... (This may take 2-3 minutes)
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
