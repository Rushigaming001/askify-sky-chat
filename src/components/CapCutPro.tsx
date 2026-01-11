import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, Download, Save, Film, Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Scissors, RotateCcw, Info, Maximize
} from 'lucide-react';
import { toast } from 'sonner';

interface Track {
  id: string;
  type: 'video' | 'audio' | 'text' | 'effect';
  src?: string;
  start: number;
  duration: number;
  content?: string;
  volume?: number;
  locked?: boolean;
  muted?: boolean;
}

export default function CapCutPro() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Video ref
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Timeline state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // Add video as first track
      const videoTrack: Track = {
        id: `video-${Date.now()}`,
        type: 'video',
        src: url,
        start: 0,
        duration: 0,
        volume: 1,
      };
      setTracks([videoTrack]);
      setTrimStart(0);
      setTrimEnd(100);
      
      toast.success('Video uploaded successfully!');
    } else {
      toast.error('Please upload a valid video file');
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = (value[0] / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Update video track duration
      if (tracks.length > 0 && tracks[0].type === 'video') {
        const updatedTracks = [...tracks];
        updatedTracks[0].duration = videoRef.current.duration;
        setTracks(updatedTracks);
      }
    }
  };

  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
    }
  };

  const handleSaveProject = () => {
    const project = {
      name: projectName,
      aspectRatio,
      tracks,
      duration,
      trimStart,
      trimEnd,
    };
    localStorage.setItem('capcut-project', JSON.stringify(project));
    toast.success('Project saved successfully!');
  };

  const handleExport = () => {
    if (!videoUrl) {
      toast.error('Please upload a video first');
      return;
    }
    
    // Create download link for the original video
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `${projectName || 'video'}.mp4`;
    link.click();
    
    toast.info('Video downloaded! Note: Browser-based editing is limited. For advanced edits, use desktop video editors.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '9:16': return 'aspect-[9/16] max-h-[400px]';
      case '1:1': return 'aspect-square max-h-[400px]';
      case '4:5': return 'aspect-[4/5] max-h-[400px]';
      default: return 'aspect-video';
    }
  };

  return (
    <div className="flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Info Alert */}
      <Alert className="m-4 mb-0">
        <Info className="h-4 w-4" />
        <AlertDescription>
          This is a basic video preview tool. For professional video editing with effects, transitions, and rendering, please use desktop software like CapCut, DaVinci Resolve, or Adobe Premiere.
        </AlertDescription>
      </Alert>

      {/* Top Bar */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Video Preview</h1>
        </div>
        
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="max-w-xs"
          placeholder="Project name"
        />

        <div className="flex items-center gap-2 ml-auto">
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
              <SelectItem value="1:1">1:1</SelectItem>
              <SelectItem value="4:5">4:5</SelectItem>
            </SelectContent>
          </Select>

          <label htmlFor="video-upload">
            <Button variant="outline" asChild>
              <span className="cursor-pointer flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
              </span>
            </Button>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>

          <Button variant="outline" onClick={handleSaveProject}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>

          <Button onClick={handleExport} disabled={!videoUrl}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        {/* Video Player */}
        <div className="flex-1 flex items-center justify-center bg-black/50 rounded-lg min-h-[300px]">
          {videoUrl ? (
            <div className={`relative ${getAspectRatioClass()} w-full max-w-3xl`}>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain rounded"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Upload a video to preview</p>
              <p className="text-sm mt-2">Supports MP4, WebM, MOV formats</p>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {videoUrl && (
          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            {/* Progress Bar */}
            <div className="space-y-1">
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleSkipBack}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSkipForward}>
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 ml-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[volume * 100]}
                  onValueChange={(v) => setVolume(v[0] / 100)}
                  max={100}
                  className="w-24"
                />
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-4"
                onClick={() => videoRef.current?.requestFullscreen()}
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {videoUrl && (
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" disabled>
              <Scissors className="h-4 w-4 mr-2" />
              Trim (Desktop Only)
            </Button>
            <Button variant="outline" size="sm" disabled>
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate (Desktop Only)
            </Button>
            <p className="text-xs text-muted-foreground flex items-center">
              Advanced editing features require desktop software
            </p>
          </div>
        )}
      </div>
    </div>
  );
}