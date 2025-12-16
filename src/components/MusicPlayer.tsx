import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Music, Upload, Trash2, Download, Shuffle, Repeat 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  name: string;
  url: string;
  duration?: number;
}

interface MusicPlayerProps {
  onAudioStream?: (stream: MediaStream | null) => void;
  compact?: boolean;
}

// Default offline tracks (embedded as base64 or from public folder)
const DEFAULT_TRACKS: Track[] = [
  { id: '1', name: 'Chill Beats', url: '/music/chill-beats.mp3' },
  { id: '2', name: 'Lo-Fi Study', url: '/music/lofi-study.mp3' },
  { id: '3', name: 'Ambient Waves', url: '/music/ambient-waves.mp3' },
];

export function MusicPlayer({ onAudioStream, compact = false }: MusicPlayerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load tracks from localStorage on mount
  useEffect(() => {
    const savedTracks = localStorage.getItem('musicPlayerTracks');
    if (savedTracks) {
      try {
        const parsed = JSON.parse(savedTracks);
        setTracks(parsed);
      } catch {
        setTracks([]);
      }
    }
  }, []);

  // Save tracks to localStorage
  useEffect(() => {
    if (tracks.length > 0) {
      localStorage.setItem('musicPlayerTracks', JSON.stringify(tracks));
    }
  }, [tracks]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        playNext();
      }
    };
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [isRepeat]);

  // Set up audio stream for VC
  useEffect(() => {
    if (onAudioStream && audioRef.current && isPlaying) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        if (!sourceNodeRef.current) {
          sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          destinationRef.current = audioContextRef.current.createMediaStreamDestination();
          sourceNodeRef.current.connect(audioContextRef.current.destination);
          sourceNodeRef.current.connect(destinationRef.current);
        }
        
        if (destinationRef.current) {
          onAudioStream(destinationRef.current.stream);
        }
      } catch (err) {
        console.error('Error setting up audio stream:', err);
      }
    } else if (onAudioStream && !isPlaying) {
      onAudioStream(null);
    }
  }, [isPlaying, onAudioStream]);

  // Load track when index changes
  useEffect(() => {
    if (tracks.length > 0 && audioRef.current) {
      const track = tracks[currentTrackIndex];
      if (track) {
        audioRef.current.src = track.url;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  }, [currentTrackIndex, tracks]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current || tracks.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
  };

  const playPrevious = () => {
    if (tracks.length === 0) return;
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not an audio file`,
          variant: 'destructive'
        });
        continue;
      }

      // Convert to base64 for offline storage
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newTrack: Track = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: base64
        };
        setTracks(prev => [...prev, newTrack]);
        toast({
          title: 'Track added',
          description: `${newTrack.name} added to playlist`
        });
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeTrack = (id: string) => {
    setTracks(prev => {
      const newTracks = prev.filter(t => t.id !== id);
      if (currentTrackIndex >= newTracks.length) {
        setCurrentTrackIndex(Math.max(0, newTracks.length - 1));
      }
      return newTracks;
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = tracks[currentTrackIndex];

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playPrevious}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playNext}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="text-xs truncate max-w-[100px]">
          {currentTrack?.name || 'No track'}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="h-5 w-5" />
          Music Player
          <span className="text-xs text-muted-foreground ml-auto">Works Offline</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Track Display */}
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
            <Music className={`h-8 w-8 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          <p className="font-medium truncate">{currentTrack?.name || 'No track selected'}</p>
          {isLoading && <p className="text-xs text-muted-foreground">Loading...</p>}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
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
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={isShuffled ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsShuffled(!isShuffled)}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={playPrevious}>
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full" 
            onClick={togglePlay}
            disabled={tracks.length === 0}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext}>
            <SkipForward className="h-5 w-5" />
          </Button>
          <Button
            variant={isRepeat ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsRepeat(!isRepeat)}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Upload */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Music
          </Button>
        </div>

        {/* Playlist */}
        {tracks.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                  index === currentTrackIndex ? 'bg-primary/20' : ''
                }`}
                onClick={() => {
                  setCurrentTrackIndex(index);
                  setIsPlaying(true);
                  audioRef.current?.play().catch(console.error);
                }}
              >
                <Music className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{track.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrack(track.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {tracks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No tracks. Upload music files to get started!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
