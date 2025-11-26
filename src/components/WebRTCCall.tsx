import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface WebRTCCallProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'video' | 'voice';
  recipientName: string;
  recipientId: string;
  isInitiator: boolean;
}

export function WebRTCCall({ 
  isOpen, 
  onClose, 
  callType, 
  recipientName,
  recipientId,
  isInitiator 
}: WebRTCCallProps) {
  const { toast } = useToast();
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const initializeCall = async () => {
    try {
      // Get user media
      const constraints = {
        video: callType === 'video',
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnecting(false);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // In a real implementation, send this to the other peer via signaling server
          console.log('New ICE candidate:', event.candidate);
        }
      };

      // Connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setIsConnecting(false);
          toast({
            title: 'Connected',
            description: `${callType === 'video' ? 'Video' : 'Voice'} call connected`
          });
        }
      };

      // If initiator, create offer
      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        // In real implementation: send offer to peer via signaling server
        console.log('Created offer:', offer);
      }

      setIsConnecting(false);
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Error',
        description: 'Failed to access camera/microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    localStreamRef.current = null;
    peerConnectionRef.current = null;
  };

  const handleEndCall = () => {
    cleanup();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleEndCall}>
      <DialogContent className="max-w-5xl h-[85vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>
            {callType === 'video' ? 'Video' : 'Voice'} Call with {recipientName}
            {isConnecting && ' - Connecting...'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col bg-muted relative overflow-hidden">
          {callType === 'video' ? (
            <>
              {/* Remote video (main) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-gray-900"
              />
              
              {/* Local video (picture-in-picture) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg bg-gray-800"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="h-40 w-40 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <span className="text-5xl font-semibold text-primary">
                    {recipientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <p className="text-2xl font-medium">{recipientName}</p>
                <p className="text-sm text-muted-foreground mt-3">
                  {isConnecting ? 'Connecting...' : 'Voice Call Active'}
                </p>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/90 backdrop-blur-sm px-6 py-4 rounded-full shadow-xl">
            {callType === 'video' && (
              <Button
                size="lg"
                variant={isVideoOn ? "default" : "destructive"}
                className="rounded-full h-14 w-14"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
              </Button>
            )}
            
            <Button
              size="lg"
              variant={isMicOn ? "default" : "destructive"}
              className="rounded-full h-14 w-14"
              onClick={toggleMic}
            >
              {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-16 w-16"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
