import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, Scissors, Sparkles, Music, Type, Film } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CapCutPro() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [trimStart, setTrimStart] = useState([0]);
  const [trimEnd, setTrimEnd] = useState([100]);
  const [editPrompt, setEditPrompt] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [processedVideoUrl, setProcessedVideoUrl] = useState('');

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      toast({ title: 'Video uploaded successfully!' });
    } else {
      toast({ title: 'Please upload a valid video file', variant: 'destructive' });
    }
  };

  const handleAIEdit = async () => {
    if (!videoFile) {
      toast({ title: 'Please upload a video first', variant: 'destructive' });
      return;
    }

    if (!editPrompt.trim()) {
      toast({ title: 'Please describe what edits you want', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      reader.onload = async () => {
        const base64Video = reader.result as string;

        const { data, error } = await supabase.functions.invoke('video-editor', {
          body: {
            videoData: base64Video.split(',')[1],
            prompt: editPrompt,
            trimStart: trimStart[0],
            trimEnd: trimEnd[0],
            textOverlay: textOverlay,
            fileName: videoFile.name
          }
        });

        if (error) throw error;

        if (data?.videoUrl) {
          setProcessedVideoUrl(data.videoUrl);
          toast({ 
            title: 'Video edited successfully!',
            description: 'Your edited video is ready to download.'
          });
        }
      };
    } catch (error: any) {
      console.error('Error editing video:', error);
      toast({
        title: 'Error editing video',
        description: error.message || 'Failed to process video. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedVideoUrl) {
      const link = document.createElement('a');
      link.href = processedVideoUrl;
      link.download = `edited_video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: 'Video download started!' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            CapCut Pro - AI Video Editor
          </CardTitle>
          <CardDescription>
            Upload, edit, and enhance your videos with AI-powered tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Scissors className="h-4 w-4 mr-2" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="enhance">
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer space-y-4 block">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Click to upload video</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, AVI, MOV, MKV (Max 100MB)
                    </p>
                  </div>
                </label>
              </div>

              {videoPreview && (
                <div className="space-y-2">
                  <Label>Video Preview</Label>
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Trim Start (%): {trimStart[0]}%</Label>
                  <Slider
                    value={trimStart}
                    onValueChange={setTrimStart}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trim End (%): {trimEnd[0]}%</Label>
                  <Slider
                    value={trimEnd}
                    onValueChange={setTrimEnd}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text-overlay" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Text Overlay
                  </Label>
                  <Input
                    id="text-overlay"
                    placeholder="Enter text to overlay on video"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enhance" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Enhancement Prompt
                </Label>
                <Textarea
                  id="ai-prompt"
                  placeholder="Describe how you want to edit your video (e.g., 'Add cinematic color grading', 'Increase brightness', 'Add smooth transitions', 'Stabilize shaky footage')"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleAIEdit}
                disabled={isProcessing || !videoFile}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing Video...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Apply AI Edits
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {processedVideoUrl && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Edited Video</Label>
                  <video
                    src={processedVideoUrl}
                    controls
                    className="w-full rounded-lg border border-border"
                  />
                </div>
                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-5 w-5 mr-2" />
                  Download Edited Video
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
