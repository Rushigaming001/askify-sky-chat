import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onTimeUpdate: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onDurationChange: (duration: number) => void;
}

export const VideoPlayer = ({
  videoUrl,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onTimeUpdate,
  onVolumeChange,
  onDurationChange,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      onDurationChange(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate, onDurationChange]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-black/5">
      {/* Video Display */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full"
              crossOrigin="anonymous"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">No video loaded</p>
            <p className="text-sm">Upload or import a video to start editing</p>
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="bg-background border-t border-border p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            disabled={!videoUrl}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>

          <span className="text-sm font-mono min-w-[80px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <Slider
            value={[currentTime]}
            onValueChange={([value]) => onTimeUpdate(value)}
            max={duration || 100}
            step={0.1}
            className="flex-1"
            disabled={!videoUrl}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              disabled={!videoUrl}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={([value]) => {
                setIsMuted(false);
                onVolumeChange(value / 100);
              }}
              max={100}
              step={1}
              className="w-20"
              disabled={!videoUrl}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            disabled={!videoUrl}
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
