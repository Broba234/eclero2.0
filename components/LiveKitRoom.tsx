'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LiveKitRoom as LKRoom,
  RoomAudioRenderer,
  VideoTrack,
  useTracks,
  TrackReference,
  useDataChannel,
  useRoomContext,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Tldraw, useEditor, getSnapshot } from 'tldraw';
import type { Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { supabase } from '@/lib/supabaseClient';
import { startScreenShare, stopScreenShare, isScreenSharing, showSuccess, BrowserCompatibility } from '@/lib/screenShare';

interface LiveKitRoomProps {
  roomName: string;
  userIdentity: string;
  userName: string;
  userRole: 'tutor' | 'student';
  onDisconnect?: () => void;
  isOpen: boolean;
}

const LiveKitRoom: React.FC<LiveKitRoomProps> = ({
  roomName,
  userIdentity,
  onDisconnect,
  isOpen,
}) => {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://eclero-livekit.livekit.cloud';

  useEffect(() => {
    if (!isOpen || !roomName || !userIdentity) return;

    const getToken = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: roomName, user: userIdentity }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to get token: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get token';
        setError(`Connection Error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    getToken();
  }, [roomName, userIdentity, isOpen]);

  if (!isOpen) return null;
  if (isLoading) return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center"><div>Connecting...</div></div>;
  if (error) return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center"><div>{error}</div></div>;
  if (!token) return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center"><div>Preparing session...</div></div>;

  return (
    <div className="fixed inset-0 z-50 bg-gray-800 text-white">
      <LKRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onDisconnect}
        style={{ height: '100vh' }}
        data-lk-theme="default"
      >
        <MainContent onDisconnect={onDisconnect} />
        <RoomAudioRenderer />
      </LKRoom>
    </div>
  );
};

function MainContent({ onDisconnect }: { onDisconnect?: () => void }) {
  const [activeView, setActiveView] = useState('whiteboard');
  const [sharedFile, setSharedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editorRef = React.useRef<Editor | null>(null);
  
  // Screen sharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrackRef, setScreenTrackRef] = useState<TrackReference | null>(null);
  const [allScreenShares, setAllScreenShares] = useState<Array<TrackReference & { timestamp: number; participantIdentity: string }>>([]);

  // Compatibility status
  const compatibilityStatus = BrowserCompatibility.getCompatibilityStatus();

  // Get room context for event listeners
  const room = useRoomContext();

  // @ts-ignore
  const { send: sendData, isSending }: { send: (data: Uint8Array) => Promise<void>; isSending: boolean } = useDataChannel({
    topic: 'eclero-collaboration',
    onMessage: (msg: any) => {
      console.log('MainContent: Raw message received:', msg);
      try {
        const message = JSON.parse(new TextDecoder().decode(msg.payload));
        console.log('MainContent: Parsed message received:', message);
        if (message.type === 'file_share') {
          setSharedFile(message.payload);
          setActiveView('file');
        } else if (message.type === 'whiteboard_update') {
          console.log('MainContent: Received whiteboard update payload:', message.payload);
          if (editorRef.current && message.payload) {
            // Use TLDraw's store.put method to apply changes
            try {
              editorRef.current.store.put(message.payload);
            } catch (error) {
              console.error('Error applying whiteboard update:', error);
            }
          }
        }
      } catch (e) {
        console.error('MainContent: Error parsing message:', e);
      }
    },
  });

  // Screen sharing event listeners
  useEffect(() => {
    if (!room) return;

    const updateScreenShareState = () => {
      // Get current screen share tracks with enhanced metadata
      const currentTime = Date.now();
      const allParticipants = [
        ...Array.from(room.remoteParticipants.values()),
        room.localParticipant
      ];
      const screenShareTracks = allParticipants
        .flatMap((participant) => {
          const screenShareTrack = participant.getTrackPublication(Track.Source.ScreenShare);
          if (screenShareTrack?.track) {
            const trackRef = {
              publication: screenShareTrack,
              participant,
              source: Track.Source.ScreenShare,
              timestamp: currentTime,
              participantIdentity: participant.identity || 'unknown'
            } as TrackReference & { timestamp: number; participantIdentity: string };
            return [trackRef];
          }
          return [];
        });

      // Update all screen shares state
      setAllScreenShares(prev => {
        const existing = prev.filter(share => 
          screenShareTracks.some(current => 
            current.publication.trackSid === share.publication.trackSid
          )
        );
        
        const newShares = screenShareTracks.filter(current => 
          !existing.some(exist => 
            exist.publication.trackSid === current.publication.trackSid
          )
        );
        
        return [...existing, ...newShares].sort((a, b) => b.timestamp - a.timestamp);
      });

      // Update primary screen share state
      if (screenShareTracks.length > 0) {
        setIsScreenSharing(true);
        // Prioritize the most recent screen share
        const mostRecentShare = screenShareTracks.reduce((latest, current) => {
          const existingShare = allScreenShares.find(s => s.publication.trackSid === current.publication.trackSid);
          const currentTimestamp = existingShare?.timestamp || currentTime;
          const latestTimestamp = allScreenShares.find(s => s.publication.trackSid === latest.publication.trackSid)?.timestamp || currentTime;
          return currentTimestamp > latestTimestamp ? current : latest;
        });
        setScreenTrackRef(mostRecentShare);
        
        // Log screen share activity
        console.log(`Screen share detected from ${mostRecentShare.participantIdentity}. Total active shares: ${screenShareTracks.length}`);
        if (screenShareTracks.length > 1) {
          const participantNames = screenShareTracks.map(t => t.participantIdentity).join(', ');
          console.log(`Multiple screen shares active: ${participantNames}. Displaying most recent.`);
        }
      } else {
        setIsScreenSharing(false);
        setScreenTrackRef(null);
        setAllScreenShares([]);
        console.log('No active screen shares detected');
      }
    };

    // Listen to track events
    const handleLocalTrackPublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        console.log('Local screen share published');
        updateScreenShareState();
      }
    };

    const handleTrackUnpublished = (publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        console.log('Screen share unpublished');
        updateScreenShareState();
      }
    };

    const handleTrackSubscribed = (track: any, publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        console.log('Screen share subscribed');
        updateScreenShareState();
      }
    };

    const handleTrackUnsubscribed = (track: any, publication: any) => {
      if (publication.source === Track.Source.ScreenShare) {
        console.log('Screen share unsubscribed');
        updateScreenShareState();
      }
    };

    // Add event listeners
    room.on('localTrackPublished', handleLocalTrackPublished);
    room.on('trackUnpublished', handleTrackUnpublished);
    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);

    // Initial state update
    updateScreenShareState();

    // Cleanup
    return () => {
      room.off('localTrackPublished', handleLocalTrackPublished);
      room.off('trackUnpublished', handleTrackUnpublished);
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [room]);

  // Set activeView to 'screen' with highest priority when screenTrackRef exists
  useEffect(() => {
    if (screenTrackRef) {
      setActiveView('screen');
    }
  }, [screenTrackRef]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Sanitize filename: replace non-alphanumeric, non-hyphen, non-underscore with hyphen
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9-_.]/g, '-');
      const filePath = `session-files/${Date.now()}-${sanitizedFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('eclero-storage')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('eclero-storage')
        .getPublicUrl(filePath);

      const message = {
        type: 'file_share',
        payload: { url: publicUrl, name: file.name, type: file.type },
      };
      await sendData(new TextEncoder().encode(JSON.stringify(message)));
      
      setSharedFile(message.payload);
      setActiveView('file');

    } catch (error: any) {
      console.error('Error uploading file:', error.message || error);
      alert(`Failed to upload file: ${error.message || 'Unknown error'}. Please check your Supabase storage configuration and try again.`);
    }
  };

  // Screen sharing handlers
  const handleStartScreenShare = async () => {
    const success = await startScreenShare(room);
    if (success) {
      // Update local state if needed - the event listeners will handle this
      console.log('Screen share initiated successfully');
    }
  };

  const handleStopScreenShare = async () => {
    const success = await stopScreenShare(room);
    if (success) {
      // Update local state if needed - the event listeners will handle this
      console.log('Screen share stopped successfully');
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Whiteboard/file/screen content within a 0.75in bezel */}
      <div
        className="absolute rounded-3xl overflow-hidden bg-white shadow-2xl"
        style={{ top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' }}
      >
        {activeView === 'whiteboard' && <CollaborativeWhiteboard sendData={sendData} editorRef={editorRef} />}
        {activeView === 'file' && sharedFile && <FileViewer file={sharedFile} />}
        {activeView === 'screen' && screenTrackRef && <ScreenView trackRef={screenTrackRef} />}
      </div>

      {/* Top-right view toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button onClick={() => setActiveView('whiteboard')} className={`px-3 py-2 rounded-2xl backdrop-blur shadow-lg border ${activeView==='whiteboard' ? 'bg-blue-600/80 text-white border-blue-300' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>Whiteboard</button>
        {sharedFile && (
          <button onClick={() => setActiveView('file')} className={`px-3 py-2 rounded-2xl backdrop-blur shadow-lg border ${activeView==='file' ? 'bg-blue-600/80 text-white border-blue-300' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>File</button>
        )}
        {screenTrackRef && (
          <button onClick={() => setActiveView('screen')} className={`px-3 py-2 rounded-2xl backdrop-blur shadow-lg border ${activeView==='screen' ? 'bg-blue-600/80 text-white border-blue-300' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>Screen</button>
        )}
      </div>

      {/* Right-side floating cams */}
      <FloatingVideos allScreenShares={allScreenShares} screenTrackRef={screenTrackRef} onSelectScreenShare={setScreenTrackRef} />

      {/* Bottom center toolbar */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3">
        <button onClick={() => fileInputRef.current?.click()} disabled={isSending} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur shadow-lg disabled:opacity-50">Share File</button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button 
          onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare} 
          disabled={isSending || !compatibilityStatus.isSupported}
          className={`px-4 py-2 rounded-2xl border backdrop-blur shadow-lg ${isScreenSharing ? 'bg-red-600/90 text-white border-red-300 hover:bg-red-600' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'} disabled:opacity-50`}
          title={compatibilityStatus.isSupported ? (isScreenSharing ? 'Click to stop screen sharing' : 'Click to share your screen. You may be prompted to grant permission.') : (compatibilityStatus.reason || 'Screen sharing is not supported.')}
        >
          {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>
        {onDisconnect && (
          <button onClick={onDisconnect} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur shadow-lg">End Session</button>
        )}
      </div>
    </div>
  );
}

function CollaborativeWhiteboard({ sendData, editorRef }: { sendData: (data: Uint8Array) => Promise<void>, editorRef: React.MutableRefObject<Editor | null> }) {
  useEffect(() => {
    // Hide watermark and extras via class targeting
    const interval = setInterval(() => {
      document.querySelector('[aria-label="Top panel"]')?.classList.add('hidden')
      document.querySelector('[aria-label="Bottom left menu"]')?.classList.add('hidden')
      document.querySelector('[aria-label="Made with TLDraw"]')?.classList.add('hidden')
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      id="whiteboard"
      className="w-full h-full relative bg-white rounded-lg ring-1 ring-gray-200 overflow-hidden"
    >
      <Tldraw
        persistenceKey="session-whiteboard"
        className="h-full w-full"
        hideUi={false}
        components={{ SharePanel: WhiteboardSync }}
        onMount={(editor) => {
          editorRef.current = editor;
          // Note: Real-time collaboration would be implemented differently in TLDraw 3.14
          // The editor.on('update') API has changed. For now, we'll just store the editor reference.
          console.log('TLDraw editor mounted:', editor);
        }}
      />
    </div>
  )
}

function WhiteboardSync() {
  const editor = useEditor();
  const room = useRoomContext();
  
  // This component doesn't render anything visible
  return null;
}

interface FloatingVideosProps {
  allScreenShares: Array<TrackReference & { timestamp: number; participantIdentity: string }>;
  screenTrackRef: TrackReference | null;
  onSelectScreenShare: (trackRef: TrackReference) => void;
}

function FloatingVideos({ allScreenShares, screenTrackRef, onSelectScreenShare }: FloatingVideosProps) {
  const tracks = useTracks();
  const videoTracks = tracks.filter((track) => track.publication.kind === 'video');

  const isParticipantSharingScreen = (participantIdentity: string) =>
    allScreenShares.some(share => share.participantIdentity === participantIdentity);

  const getParticipantScreenShare = (participantIdentity: string) =>
    allScreenShares.find(share => share.participantIdentity === participantIdentity);

  return (
    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
      {videoTracks.map((trackRef: TrackReference) => {
        const participantIdentity = trackRef.participant.identity || 'unknown';
        const sharing = isParticipantSharingScreen(participantIdentity);
        const participantShare = getParticipantScreenShare(participantIdentity);
        const isActive = screenTrackRef?.publication.trackSid === participantShare?.publication.trackSid;

        return (
          <div key={trackRef.publication.trackSid} className="relative pointer-events-auto w-[180px] h-[132px] rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur shadow-2xl">
            <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Label */}
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white">
              {participantIdentity}
            </div>
            {/* Screen share indicator + switch */}
            {sharing && (
              <button
                onClick={() => participantShare && onSelectScreenShare(participantShare)}
                className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-semibold shadow ${isActive ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                title={isActive ? 'Viewing screen' : `View ${participantIdentity}'s screen`}
              >
                {isActive ? 'LIVE' : 'SCREEN'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScreenView({ trackRef }: { trackRef: TrackReference }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <VideoTrack 
        trackRef={trackRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain' 
        }} 
      />
    </div>
  );
}

function FileViewer({ file }: { file: { url: string; name: string; type: string } }) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-700">
      {isImage ? (
        <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain" />
      ) : (
        <div className="text-center">
          <h3 className="text-2xl font-bold">{file.name}</h3>
          <p className="text-gray-400">File type not supported for preview</p>
          <a href={file.url} download={file.name} className="text-blue-400 hover:underline mt-4 inline-block">Download File</a>
        </div>
      )}
    </div>
  );
}

export default LiveKitRoom; 
