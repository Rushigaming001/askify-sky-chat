import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wand2, MessageSquare, Mic, Volume2, Scissors, 
  Sparkles, Palette, Video, Image as ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const AIPanel = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [voiceCloneText, setVoiceCloneText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  const handleGenerateCaptions = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('video-editor', {
        body: { action: 'generate_captions', language: captionLanguage }
      });

      if (error) throw error;
      toast.success('Auto captions generated!');
    } catch (error: any) {
      toast.error('Failed to generate captions: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceClone = async () => {
    if (!voiceCloneText) {
      toast.error('Please enter text for voice cloning');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('video-editor', {
        body: { action: 'voice_clone', text: voiceCloneText }
      });

      if (error) throw error;
      toast.success('Voice cloned successfully!');
    } catch (error: any) {
      toast.error('Failed to clone voice: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSilence = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('video-editor', {
        body: { action: 'remove_silence' }
      });

      if (error) throw error;
      toast.success('Silence removed from video!');
    } catch (error: any) {
      toast.error('Failed to remove silence: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoiseReduction = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('video-editor', {
        body: { action: 'noise_reduction' }
      });

      if (error) throw error;
      toast.success('Background noise reduced!');
    } catch (error: any) {
      toast.error('Failed to reduce noise: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('video-editor', {
        body: { action: 'remove_background' }
      });

      if (error) throw error;
      toast.success('Background removed!');
    } catch (error: any) {
      toast.error('Failed to remove background: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIGenerate = async (type: 'video' | 'image') => {
    if (!aiPrompt) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('video-editor', {
        body: { 
          action: type === 'video' ? 'generate_video' : 'generate_image',
          prompt: aiPrompt 
        }
      });

      if (error) throw error;
      toast.success(`AI ${type} generated successfully!`);
      setAiPrompt('');
    } catch (error: any) {
      toast.error(`Failed to generate ${type}: ` + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Tools
        </h3>
      </div>

      <Tabs defaultValue="captions" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-4 mt-2">
          <TabsTrigger value="captions">Captions</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="captions" className="mt-0 space-y-4">
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Auto Captions
              </Label>
              <Select value={captionLanguage} onValueChange={setCaptionLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                className="w-full" 
                onClick={handleGenerateCaptions}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Generate Captions'}
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label>Auto Translation</Label>
              <p className="text-xs text-muted-foreground">
                Automatically translate captions to multiple languages
              </p>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Target language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full">
                Translate Captions
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="mt-0 space-y-4">
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                AI Voice Clone
              </Label>
              <Textarea
                placeholder="Enter text to generate with cloned voice..."
                value={voiceCloneText}
                onChange={(e) => setVoiceCloneText(e.target.value)}
                rows={4}
              />
              <Button 
                className="w-full"
                onClick={handleVoiceClone}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Clone Voice'}
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Smart Silence Removal
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically detect and remove silent parts
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRemoveSilence}
                disabled={isProcessing}
              >
                Remove Silence
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                AI Noise Reduction
              </Label>
              <p className="text-xs text-muted-foreground">
                Remove background noise from audio
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleNoiseReduction}
                disabled={isProcessing}
              >
                Reduce Noise
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="visual" className="mt-0 space-y-4">
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                AI Background Removal
              </Label>
              <p className="text-xs text-muted-foreground">
                Remove background automatically using AI
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRemoveBackground}
                disabled={isProcessing}
              >
                Remove Background
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                AI Video Generator
              </Label>
              <Textarea
                placeholder="Describe the video you want to generate..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
              />
              <Button 
                className="w-full"
                onClick={() => handleAIGenerate('video')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Generating...' : 'Generate Video'}
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                AI Image Generator
              </Label>
              <Textarea
                placeholder="Describe the image you want to generate..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleAIGenerate('image')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Generating...' : 'Generate Image'}
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
