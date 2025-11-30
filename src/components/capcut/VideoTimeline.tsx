import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Scissors, Copy, Trash2, Volume2, VolumeX } from 'lucide-react';
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

interface VideoTimelineProps {
  tracks: Track[];
  onTracksUpdate: (tracks: Track[]) => void;
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
}

export const VideoTimeline = ({ 
  tracks, 
  onTracksUpdate, 
  currentTime, 
  totalDuration,
  onSeek 
}: VideoTimelineProps) => {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const timelineRef = useRef<HTMLDivElement>(null);

  const pixelsPerSecond = zoom;

  const handleTrackClick = (trackId: string) => {
    setSelectedTrack(trackId);
  };

  const handleSplit = () => {
    if (!selectedTrack) {
      toast.error('Please select a track to split');
      return;
    }

    const track = tracks.find(t => t.id === selectedTrack);
    if (!track) return;

    if (currentTime < track.start || currentTime > track.start + track.duration) {
      toast.error('Playhead must be within the selected track');
      return;
    }

    const splitPoint = currentTime - track.start;
    const newTracks = tracks.filter(t => t.id !== selectedTrack);
    
    const firstPart: Track = {
      ...track,
      id: `${track.id}-1`,
      duration: splitPoint,
    };

    const secondPart: Track = {
      ...track,
      id: `${track.id}-2`,
      start: track.start + splitPoint,
      duration: track.duration - splitPoint,
    };

    onTracksUpdate([...newTracks, firstPart, secondPart]);
    toast.success('Track split successfully');
  };

  const handleDelete = () => {
    if (!selectedTrack) {
      toast.error('Please select a track to delete');
      return;
    }

    onTracksUpdate(tracks.filter(t => t.id !== selectedTrack));
    setSelectedTrack(null);
    toast.success('Track deleted');
  };

  const handleCopy = () => {
    if (!selectedTrack) {
      toast.error('Please select a track to copy');
      return;
    }

    const track = tracks.find(t => t.id === selectedTrack);
    if (!track) return;

    const newTrack: Track = {
      ...track,
      id: `${track.id}-copy-${Date.now()}`,
      start: track.start + track.duration + 0.5,
    };

    onTracksUpdate([...tracks, newTrack]);
    toast.success('Track copied');
  };

  const handleToggleMute = (trackId: string) => {
    const updatedTracks = tracks.map(t => 
      t.id === trackId ? { ...t, muted: !t.muted } : t
    );
    onTracksUpdate(updatedTracks);
  };

  const handleToggleLock = (trackId: string) => {
    const updatedTracks = tracks.map(t => 
      t.id === trackId ? { ...t, locked: !t.locked } : t
    );
    onTracksUpdate(updatedTracks);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * totalDuration;
    onSeek(Math.max(0, Math.min(time, totalDuration)));
  };

  return (
    <div className="bg-background border-t border-border">
      {/* Timeline Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={handleSplit} title="Split Track">
          <Scissors className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy Track">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete Track">
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <div className="flex-1" />
        
        <span className="text-xs text-muted-foreground">Zoom:</span>
        <Slider
          value={[zoom]}
          onValueChange={([value]) => setZoom(value)}
          min={50}
          max={200}
          step={10}
          className="w-24"
        />
      </div>

      {/* Timeline Grid */}
      <div className="relative overflow-x-auto" style={{ height: '300px' }}>
        <div 
          ref={timelineRef}
          className="relative h-full cursor-pointer"
          onClick={handleTimelineClick}
          style={{ minWidth: `${totalDuration * pixelsPerSecond}px` }}
        >
          {/* Time Markers */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-border bg-muted/30">
            {Array.from({ length: Math.ceil(totalDuration) }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-border/50"
                style={{ left: `${i * pixelsPerSecond}px` }}
              >
                <span className="absolute top-1 left-1 text-[10px] text-muted-foreground">
                  {i}s
                </span>
              </div>
            ))}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
            style={{ left: `${currentTime * pixelsPerSecond}px` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-primary rounded-full" />
          </div>

          {/* Tracks */}
          <div className="absolute top-6 left-0 right-0 bottom-0">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="absolute h-16 flex items-center"
                style={{
                  top: `${index * 70}px`,
                  left: `${track.start * pixelsPerSecond}px`,
                  width: `${track.duration * pixelsPerSecond}px`,
                }}
              >
                <div
                  className={`
                    w-full h-full rounded border-2 cursor-move transition-all
                    ${selectedTrack === track.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                    ${track.locked ? 'opacity-50 cursor-not-allowed' : ''}
                    ${track.type === 'video' ? 'bg-blue-500/20' : ''}
                    ${track.type === 'audio' ? 'bg-green-500/20' : ''}
                    ${track.type === 'text' ? 'bg-purple-500/20' : ''}
                    ${track.type === 'effect' ? 'bg-orange-500/20' : ''}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackClick(track.id);
                  }}
                >
                  <div className="p-2 h-full flex flex-col justify-between">
                    <div className="flex items-center gap-1 text-xs font-medium truncate">
                      <span className="capitalize">{track.type}</span>
                      {track.content && <span className="text-muted-foreground">- {track.content}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {track.type === 'audio' || track.type === 'video' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMute(track.id);
                          }}
                        >
                          {track.muted ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
