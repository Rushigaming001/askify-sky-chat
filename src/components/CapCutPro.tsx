import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload, Download, Save, Film
} from 'lucide-react';
import { toast } from 'sonner';
import { VideoPlayer } from './capcut/VideoPlayer';
import { VideoTimeline } from './capcut/VideoTimeline';
import { EffectsPanel } from './capcut/EffectsPanel';
import { AIPanel } from './capcut/AIPanel';

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
  
  // Timeline state
  const [tracks, setTracks] = useState<Track[]>([]);
  const [activePanel, setActivePanel] = useState<'effects' | 'ai'>('effects');

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
        duration: 0, // Will be updated when metadata loads
        volume: 1,
      };
      setTracks([videoTrack]);
      
      toast.success('Video uploaded successfully!');
    } else {
      toast.error('Please upload a valid video file');
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
    // Update video track duration
    if (tracks.length > 0 && tracks[0].type === 'video') {
      const updatedTracks = [...tracks];
      updatedTracks[0].duration = newDuration;
      setTracks(updatedTracks);
    }
  };

  const handleSaveProject = () => {
    const project = {
      name: projectName,
      aspectRatio,
      tracks,
      duration,
    };
    localStorage.setItem('capcut-project', JSON.stringify(project));
    toast.success('Project saved successfully!');
  };

  const handleExport = () => {
    toast.info('Export feature coming soon! This will render your final video.');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">CapCut Pro</h1>
        </div>
        
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="max-w-xs"
        />

        <div className="flex items-center gap-2 ml-auto">
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger className="w-32">
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

          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Player Section */}
        <div className="flex-1 flex flex-col">
          <VideoPlayer
            videoUrl={videoUrl}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onPlayPause={handlePlayPause}
            onTimeUpdate={setCurrentTime}
            onVolumeChange={setVolume}
            onDurationChange={handleDurationChange}
          />

          {/* Timeline */}
          <VideoTimeline
            tracks={tracks}
            onTracksUpdate={setTracks}
            currentTime={currentTime}
            totalDuration={duration || 100}
            onSeek={handleSeek}
          />
        </div>

        {/* Right Panel */}
        <div className="w-80 flex flex-col border-l border-border">
          <div className="flex border-b border-border">
            <Button
              variant={activePanel === 'effects' ? 'default' : 'ghost'}
              className="flex-1 rounded-none"
              onClick={() => setActivePanel('effects')}
            >
              Effects
            </Button>
            <Button
              variant={activePanel === 'ai' ? 'default' : 'ghost'}
              className="flex-1 rounded-none"
              onClick={() => setActivePanel('ai')}
            >
              AI Tools
            </Button>
          </div>

          {activePanel === 'effects' ? <EffectsPanel /> : <AIPanel />}
        </div>
      </div>
    </div>
  );
}
