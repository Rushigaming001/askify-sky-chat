import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LiveVideoCall() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
      
      // Start analyzing frames every 3 seconds
      intervalRef.current = setInterval(() => {
        captureAndAnalyze();
      }, 3000);

      toast({
        title: 'Camera Started',
        description: 'AI is now watching and analyzing what you show it'
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please grant camera permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setAnalysis('');
    
    toast({
      title: 'Camera Stopped',
      description: 'Live video call ended'
    });
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const { data, error } = await supabase.functions.invoke('image-ai', {
        body: { 
          action: 'analyze', 
          imageUrl: imageData,
          prompt: 'You are a helpful AI assistant with vision capabilities. Describe what you see in this image in detail. If there are any objects, text, people, or actions, mention them. If the user is showing you something specific, provide relevant information about it. Keep your response conversational and helpful.'
        }
      });

      if (error) throw error;

      setAnalysis(prev => {
        const newAnalysis = `[${new Date().toLocaleTimeString()}] ${data.analysis}\n\n`;
        return newAnalysis + prev;
      });
    } catch (error) {
      console.error('Error analyzing frame:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stream]);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden border border-border bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center p-4">
                <VideoOff className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Camera is off</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full flex items-center gap-2 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing...
            </div>
          )}
        </div>

        <Button 
          onClick={isActive ? stopVideo : startVideo}
          variant={isActive ? "destructive" : "default"}
          className="w-full"
        >
          {isActive ? (
            <>
              <VideoOff className="mr-2 h-4 w-4" />
              Stop Video Call
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Start Live Video Call
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-primary">AI is seeing:</h4>
          <ScrollArea className="h-64 rounded-lg border border-border bg-muted/30 p-4">
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
        <p className="font-medium mb-1">💡 How it works:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>AI analyzes what your camera sees every 3 seconds</li>
          <li>Show objects, text, or anything to get information</li>
          <li>Real-time descriptions and helpful insights</li>
          <li>Point camera at what you want to learn about</li>
        </ul>
      </div>
    </div>
  );
}
