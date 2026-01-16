import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Send, X, Loader2, Image, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SnapSenderProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SnapSender({ recipientId, recipientName, recipientAvatar, isOpen, onClose }: SnapSenderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 15MB',
        variant: 'destructive'
      });
      return;
    }

    setCapturing(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `snaps/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      setMediaUrl(publicUrl);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleSendSnap = async () => {
    if (!mediaUrl || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('snaps').insert({
        sender_id: user.id,
        receiver_id: recipientId,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption || null
      });

      if (error) throw error;

      toast({ title: 'Snap sent! 📸' });
      onClose();
      setMediaUrl(null);
      setCaption('');
    } catch (error: any) {
      console.error('Error sending snap:', error);
      toast({
        title: 'Failed to send snap',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Camera className="h-5 w-5 text-yellow-500" />
            Send Snap to {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="h-10 w-10">
              {recipientAvatar ? (
                <AvatarImage src={recipientAvatar} />
              ) : null}
              <AvatarFallback>{getInitials(recipientName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{recipientName}</p>
              <p className="text-xs text-muted-foreground">Snap will auto-delete after viewing</p>
            </div>
          </div>

          {/* Media Preview or Upload */}
          {mediaUrl ? (
            <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="w-full h-full object-contain" />
              ) : (
                <img src={mediaUrl} alt="Snap" className="w-full h-full object-contain" />
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => setMediaUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {capturing ? (
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="flex gap-4">
                    <div className="p-4 bg-muted rounded-full">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="p-4 bg-muted rounded-full">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-center">
                    Tap to add photo or video
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Caption */}
          {mediaUrl && (
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="text-center"
            />
          )}

          {/* Send Button */}
          <Button 
            onClick={handleSendSnap}
            disabled={!mediaUrl || sending}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Snap
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Snap Viewer component
interface SnapViewerProps {
  snap: {
    id: string;
    sender_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    caption?: string;
    sender?: { name: string; avatar_url?: string };
  };
  onViewed: () => void;
}

export function SnapViewer({ snap, onViewed }: SnapViewerProps) {
  const [viewing, setViewing] = useState(false);
  const { user } = useAuth();

  const handleView = async () => {
    setViewing(true);
    
    // Mark as viewed
    await supabase
      .from('snaps')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', snap.id);

    // Auto close after 5 seconds for images
    if (snap.media_type === 'image') {
      setTimeout(() => {
        setViewing(false);
        onViewed();
      }, 5000);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!viewing) {
    return (
      <Button
        variant="outline"
        onClick={handleView}
        className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
      >
        <Camera className="h-4 w-4 text-yellow-500" />
        <span>New Snap from {snap.sender?.name}</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => { setViewing(false); onViewed(); }}>
      {/* Header */}
      <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
        <Avatar className="h-10 w-10 border-2 border-white">
          {snap.sender?.avatar_url ? (
            <AvatarImage src={snap.sender.avatar_url} />
          ) : null}
          <AvatarFallback>{getInitials(snap.sender?.name || 'User')}</AvatarFallback>
        </Avatar>
        <p className="text-white font-medium">{snap.sender?.name}</p>
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => { setViewing(false); onViewed(); }}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Media */}
      {snap.media_type === 'video' ? (
        <video 
          src={snap.media_url} 
          autoPlay 
          onEnded={() => { setViewing(false); onViewed(); }}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <img src={snap.media_url} alt="Snap" className="max-w-full max-h-full object-contain" />
      )}

      {/* Caption */}
      {snap.caption && (
        <div className="absolute bottom-20 left-4 right-4 text-center">
          <p className="text-white text-lg drop-shadow-lg">{snap.caption}</p>
        </div>
      )}

      {/* Timer bar for images */}
      {snap.media_type === 'image' && (
        <div className="absolute bottom-8 left-4 right-4">
          <div className="h-1 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-[shrink_5s_linear_forwards]" />
          </div>
        </div>
      )}
    </div>
  );
}