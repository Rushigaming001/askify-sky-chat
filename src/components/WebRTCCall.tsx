import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const [participants, setParticipants] = useState<Array<{ user_id: string; name: string; call_type: string }>>([]);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const signalingChannelRef = useRef<any>(null);
  const [callId] = useState(() => `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isOpen && recipientId === 'public') {
      // Track participants in public calls
      const loadParticipants = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, name')
          .limit(20);
        
        if (data && user) {
          // Add current user to presence
          const currentUserData = {
            user_id: user.id,
            name: data.find(p => p.id === user.id)?.name || 'You',
            call_type: callType
          };
          
          setParticipants([currentUserData]);
        }
      };

      loadParticipants();

      // Subscribe to call presence
      const channel = supabase.channel(`call-${callType}-presence`);
      channelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const participantsList: Array<{ user_id: string; name: string; call_type: string }> = [];
          
          Object.keys(state).forEach(key => {
            const presences = state[key];
            presences.forEach((presence: any) => {
              participantsList.push({
                user_id: presence.user_id,
                name: presence.name,
                call_type: presence.call_type
              });
            });
          });
          
          setParticipants(participantsList);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', user.id)
              .single();

            await channel.track({
              user_id: user.id,
              name: profile?.name || 'Unknown',
              call_type: callType
            });
          }
        });
    }

    if (isOpen) {
      initializeCall();
      setupSignaling();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (signalingChannelRef.current) {
        supabase.removeChannel(signalingChannelRef.current);
      }
      cleanup();
    };
  }, [isOpen, recipientId, callType, user]);

  const setupSignaling = () => {
    if (!user || recipientId === 'public') return;

    const signalingChannel = supabase.channel(`webrtc-${callId}`);
    signalingChannelRef.current = signalingChannel;

    signalingChannel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        console.log('Received offer:', payload);
        if (payload.to === user.id && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          signalingChannel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { answer, to: payload.from, from: user.id }
          });
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        console.log('Received answer:', payload);
        if (payload.to === user.id && peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        console.log('Received ICE candidate:', payload);
        if (payload.to === user.id && peerConnectionRef.current && payload.candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      })
      .subscribe();
  };

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
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
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
        console.log('Received remote track:', event);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setIsConnecting(false);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && signalingChannelRef.current && user) {
          console.log('Sending ICE candidate:', event.candidate);
          signalingChannelRef.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: { candidate: event.candidate, to: recipientId, from: user.id }
          });
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
        } else if (peerConnection.connectionState === 'failed') {
          toast({
            title: 'Connection Failed',
            description: 'Failed to establish connection. Please try again.',
            variant: 'destructive'
          });
        }
      };

      // If initiator, create offer
      if (isInitiator && user && recipientId !== 'public') {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        if (signalingChannelRef.current) {
          console.log('Sending offer:', offer);
          signalingChannelRef.current.send({
            type: 'broadcast',
            event: 'offer',
            payload: { offer, to: recipientId, from: user.id, callId }
          });
        }
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
          <DialogTitle className="flex items-center gap-3">
            <span>
              {callType === 'video' ? 'Video' : 'Voice'} Call with {recipientName}
              {isConnecting && ' - Connecting...'}
            </span>
            {recipientId === 'public' && participants.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span>{participants.length}</span>
              </Badge>
            )}
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

          {/* Participants list for public calls */}
          {recipientId === 'public' && participants.length > 0 && (
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 max-w-xs shadow-lg">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <Users className="h-4 w-4" />
                <span>In Call ({participants.length})</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.user_id} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="truncate">{participant.name}</span>
                  </div>
                ))}
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
