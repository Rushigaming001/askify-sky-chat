import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CallInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'video' | 'voice';
  recipientName: string;
}

export function CallInterface({ isOpen, onClose, callType, recipientName }: CallInterfaceProps) {
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isMicOn, setIsMicOn] = useState(true);

  const handleEndCall = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{callType === 'video' ? 'Video' : 'Voice'} Call with {recipientName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col items-center justify-center bg-muted rounded-lg relative">
          {callType === 'video' ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Video className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Video Call</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Video calling feature is coming soon
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-semibold text-primary">
                    {recipientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <p className="text-lg font-medium">{recipientName}</p>
                <p className="text-sm text-muted-foreground mt-2">Voice Call Active</p>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {callType === 'video' && (
              <Button
                size="lg"
                variant={isVideoOn ? "default" : "destructive"}
                className="rounded-full h-14 w-14"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            )}
            
            <Button
              size="lg"
              variant={isMicOn ? "default" : "destructive"}
              className="rounded-full h-14 w-14"
              onClick={() => setIsMicOn(!isMicOn)}
            >
              {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-14 w-14"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
