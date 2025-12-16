import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipForward, SkipBack, Repeat, Repeat1, 
  Volume2, VolumeX, ListMusic, X, Music, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  videoId: string;
}

interface PublicChatMusicPlayerProps {
  isVisible: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  queue: Track[];
  onQueueUpdate: (queue: Track[]) => void;
  onTrackChange?: (track: Track | null) => void;
}

export function PublicChatMusicPlayer({ 
  isVisible, 
  onClose, 
  currentTrack, 
  queue, 
  onQueueUpdate 
}: PublicChatMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<'off' | 'all' | 'one'>('off');
  const [showQueue, setShowQueue] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      if (currentTrack && playerRef.current) {
        initPlayer(currentTrack.videoId);
      }
    };

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (currentTrack && window.YT && window.YT.Player) {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.loadVideoById(currentTrack.videoId);
      } else {
        initPlayer(currentTrack.videoId);
      }
    }
  }, [currentTrack]);

  const initPlayer = (videoId: string) => {
    ytPlayerRef.current = new window.YT.Player('yt-player', {
      height: '0',
      width: '0',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume);
          setDuration(event.target.getDuration());
          setIsPlaying(true);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            handleTrackEnd();
          } else if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          }
        }
      }
    });

    // Update time
    setInterval(() => {
      if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime() || 0);
      }
    }, 1000);
  };

  const handleTrackEnd = () => {
    if (loopMode === 'one') {
      ytPlayerRef.current?.seekTo(0);
      ytPlayerRef.current?.playVideo();
    } else if (queue.length > 0) {
      playNext();
    } else if (loopMode === 'all' && currentTrack) {
      ytPlayerRef.current?.seekTo(0);
      ytPlayerRef.current?.playVideo();
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
    }
  };

  const playNext = () => {
    if (queue.length > 0) {
      const [nextTrack, ...restQueue] = queue;
      onQueueUpdate(restQueue);
      if (ytPlayerRef.current) {
        ytPlayerRef.current.loadVideoById(nextTrack.videoId);
      }
    }
  };

  const playPrevious = () => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(0);
    }
  };

  const handleSeek = (value: number[]) => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(value[0]);
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(newVolume);
    }
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume);
      } else {
        ytPlayerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleLoop = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(loopMode);
    setLoopMode(modes[(currentIndex + 1) % 3]);
  };

  const removeFromQueue = (index: number) => {
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    onQueueUpdate(newQueue);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 md:w-96 bg-background/95 backdrop-blur border shadow-xl z-50 animate-fade-in">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Music Player</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowQueue(!showQueue)}
            >
              <ListMusic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hidden YouTube Player */}
        <div id="yt-player" className="hidden" />

        {/* Current Track Info */}
        {currentTrack ? (
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={currentTrack.thumbnail} 
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.channelTitle}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
            No track playing. Use /play [song] in chat!
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1 mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleLoop}
          >
            {loopMode === 'one' ? (
              <Repeat1 className="h-4 w-4 text-primary" />
            ) : (
              <Repeat className={`h-4 w-4 ${loopMode === 'all' ? 'text-primary' : ''}`} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={playPrevious}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePlay}
            disabled={!currentTrack}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={playNext}
            disabled={queue.length === 0}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMute}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2 mb-2">
          <VolumeX className="h-3 w-3 text-muted-foreground" />
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <Volume2 className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Queue */}
        {showQueue && queue.length > 0 && (
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs font-medium mb-2">Queue ({queue.length})</p>
            <ScrollArea className="h-32">
              <div className="space-y-1">
                {queue.map((track, index) => (
                  <div 
                    key={`${track.videoId}-${index}`}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 group"
                  >
                    <img 
                      src={track.thumbnail} 
                      alt={track.title}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{track.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeFromQueue(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </Card>
  );
}

// Add YouTube types
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
