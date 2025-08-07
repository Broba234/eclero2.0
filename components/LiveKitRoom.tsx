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
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          {activeView === 'whiteboard' && <CollaborativeWhiteboard sendData={sendData} editorRef={editorRef} />}
          {activeView === 'file' && sharedFile && <FileViewer file={sharedFile} />}
          {activeView === 'screen' && screenTrackRef && <ScreenView trackRef={screenTrackRef} />}
        </div>
      </div>

      <div className="w-64 bg-gray-900 p-4 flex flex-col space-y-4">
        <h2 className="text-xl font-bold">Session</h2>
        <VideoSidebar allScreenShares={allScreenShares} screenTrackRef={screenTrackRef} onSelectScreenShare={setScreenTrackRef} />
        <div className="space-y-2">
          <button onClick={() => setActiveView('whiteboard')} className={`w-full px-4 py-2 rounded-lg ${activeView === 'whiteboard' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>Whiteboard</button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg" disabled={isSending}>Share File</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          {sharedFile && (
            <button onClick={() => setActiveView('file')} className={`w-full px-4 py-2 rounded-lg ${activeView === 'file' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>View File</button>
          )}
          {screenTrackRef && (
            <button onClick={() => setActiveView('screen')} className={`w-full px-4 py-2 rounded-lg ${activeView === 'screen' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'} text-white`}>View Screen</button>
          )}
          
          {/* Screen Share Toggle Button */}
          <button 
            onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare} 
            disabled={isSending || !compatibilityStatus.isSupported}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            title={compatibilityStatus.isSupported ? (isScreenSharing ? 'Click to stop screen sharing' : 'Click to share your screen. You may be prompted to grant permission.') : (compatibilityStatus.reason || 'Screen sharing is not supported.')}
          >
            {isScreenSharing ? 'Stop Share' : 'Share Screen'}
          </button>
          
          {/* Screen sharing buttons */}
          <div className="border-t border-gray-600 pt-2">
            {!isScreenSharing ? (
              <button 
                onClick={handleStartScreenShare} 
                disabled={!compatibilityStatus.isSupported}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                title={compatibilityStatus.isSupported ? 'Click to share your screen. You may be prompted to grant permission.' : (compatibilityStatus.reason || 'Screen sharing is not supported.')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Share Screen</span>
              </button>
            ) : (
              <button 
                onClick={handleStopScreenShare} 
                className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                title="Click to stop screen sharing"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                <span>Stop Sharing</span>
              </button>
            )}
          </div>
        </div>
        {onDisconnect && <button onClick={onDisconnect} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg mt-auto">End Session</button>}
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

interface VideoSidebarProps {
  allScreenShares: Array<TrackReference & { timestamp: number; participantIdentity: string }>;
  screenTrackRef: TrackReference | null;
  onSelectScreenShare: (trackRef: TrackReference) => void;
}

function VideoSidebar({ allScreenShares, screenTrackRef, onSelectScreenShare }: VideoSidebarProps) {
  const tracks = useTracks();
  const videoTracks = tracks.filter((track) => track.publication.kind === 'video');
  
  // Helper function to check if a participant is sharing screen
  const isParticipantSharingScreen = (participantIdentity: string) => {
    return allScreenShares.some(share => share.participantIdentity === participantIdentity);
  };
  
  // Helper function to get screen share for a participant
  const getParticipantScreenShare = (participantIdentity: string) => {
    return allScreenShares.find(share => share.participantIdentity === participantIdentity);
  };
  
  return (
    <div className="space-y-4">
      {/* Multiple Screen Share Selector */}
      {allScreenShares.length > 1 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Active Screen Shares ({allScreenShares.length})
          </h3>
          <div className="space-y-1">
            {allScreenShares.map((share) => (
              <button
                key={share.publication.trackSid}
                onClick={() => {
                  onSelectScreenShare(share);
                }}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  screenTrackRef?.publication.trackSid === share.publication.trackSid
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                title={`Switch to ${share.participantIdentity}'s screen share`}
              >
                📺 {share.participantIdentity || 'Unknown'}
                {screenTrackRef?.publication.trackSid === share.publication.trackSid && ' (Active)'}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Participant Video Thumbnails with Screen Share Indicators */}
      {videoTracks.map((trackRef: TrackReference) => {
        const participantIdentity = trackRef.participant.identity || 'unknown';
        const isScreenSharing = isParticipantSharingScreen(participantIdentity);
        const participantScreenShare = getParticipantScreenShare(participantIdentity);
        const isActiveScreenShare = screenTrackRef?.publication.trackSid === participantScreenShare?.publication.trackSid;
        
        return (
          <div key={trackRef.publication.trackSid} className="rounded-lg overflow-hidden relative group">
            <VideoTrack trackRef={trackRef} />
            
            {/* Screen Share Indicator Overlay */}
            {isScreenSharing && (
              <div className="absolute top-2 right-2 z-10">
                <div 
                  className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 shadow-lg ${
                    isActiveScreenShare 
                      ? 'bg-green-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}
                  title={`${participantIdentity} is sharing their screen${isActiveScreenShare ? ' (Currently viewing)' : ''}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{isActiveScreenShare ? 'LIVE' : 'SHARING'}</span>
                </div>
                
                {/* Click to view screen share button (shown on hover) */}
                {!isActiveScreenShare && participantScreenShare && (
                  <button
                    onClick={() => onSelectScreenShare(participantScreenShare)}
                    className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title={`Click to view ${participantIdentity}'s screen share`}
                  >
                    <div className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Screen</span>
                    </div>
                  </button>
                )}
              </div>
            )}
            
            {/* Participant name label */}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-xs text-white">
              {participantIdentity}
            </div>
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