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
import { Track, type DataPublishOptions } from 'livekit-client';
import { getSceneVersion } from '@excalidraw/excalidraw';
import '@livekit/components-styles';
import dynamic from 'next/dynamic';
// Using 'any' for imperative API type to avoid version export mismatches
// Excalidraw CSS will be added after install
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
  const excalidrawRef = React.useRef<any | null>(null);
  const pendingSceneRef = React.useRef<{ elements: any[]; files?: any } | null>(null);
  const requestedSceneRef = React.useRef(false);
  const [isExcalidrawReady, setIsExcalidrawReady] = useState(false);
  
  // Screen sharing state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrackRef, setScreenTrackRef] = useState<TrackReference | null>(null);
  const [allScreenShares, setAllScreenShares] = useState<Array<TrackReference & { timestamp: number; participantIdentity: string }>>([]);
  const [dataStats, setDataStats] = useState<{
    sent: number;
    received: number;
    lastType: string;
    lastFrom: string;
    lastError: string;
  }>({ sent: 0, received: 0, lastType: '', lastFrom: '', lastError: '' });

  // Compatibility status
  const compatibilityStatus = BrowserCompatibility.getCompatibilityStatus();

  // Get room context for event listeners
  const room = useRoomContext();

  const applyExcalidrawScene = useCallback(
    (scene: { elements: any[]; files?: any } | null | undefined) => {
      if (!scene || !scene.elements) return;
      if (excalidrawRef.current?.updateScene) {
        excalidrawRef.current.updateScene(scene);
      } else {
        pendingSceneRef.current = scene;
      }
    },
    [excalidrawRef],
  );

  const getCleanElements = useCallback((elements: any[] | null | undefined) => {
    if (!elements) return [];
    return elements.filter((el: any) => !el.isDeleted);
  }, []);

  const { send: sendData, isSending }: { send: (data: Uint8Array, options?: DataPublishOptions) => Promise<void>; isSending: boolean } = useDataChannel(
    'eclero-collaboration',
    (msg: any) => {
      console.log('MainContent: Raw message received:', msg);
      try {
        const message = JSON.parse(new TextDecoder().decode(msg.payload));
        console.log('MainContent: Parsed message received:', message);
          setDataStats((prev) => ({
            ...prev,
            received: prev.received + 1,
            lastType: message?.type || 'unknown',
            lastFrom: msg?.from?.identity || 'unknown',
          }));
          if (message.type === 'file_share') {
            setSharedFile(message.payload);
            setActiveView('file');
          } else if (message.type === 'excalidraw_update') {
            try {
              const { elements = [], files } = message.payload || {};
              applyExcalidrawScene({ elements, files });
            } catch (error) {
              console.error('Error applying excalidraw update:', error);
            }
          } else if (message.type === 'excalidraw_request') {
            try {
              const api = excalidrawRef.current;
              const elements = api?.getSceneElements?.() || [];
              const files = api?.getFiles?.() || {};
              const clean = getCleanElements(elements);

              const payload = {
                elements: clean,
                files,
              };

              const response = {
                type: 'excalidraw_state',
                payload,
              };
              sendDataSafe(new TextEncoder().encode(JSON.stringify(response)));
            } catch (error) {
              console.error('Error responding to excalidraw state request:', error);
            }
          } else if (message.type === 'excalidraw_state') {
            try {
              const { elements = [], files } = message.payload || {};
              applyExcalidrawScene({ elements, files });
            } catch (error) {
              console.error('Error applying excalidraw state:', error);
            }
          }
      } catch (e) {
        console.error('MainContent: Error parsing message:', e);
      }
    },
  );

  const sendDataSafe = useCallback(
    async (payload: Uint8Array, options: DataPublishOptions = { reliable: true }) => {
      try {
        await sendData(payload, options);
        setDataStats((prev) => ({ ...prev, sent: prev.sent + 1, lastError: '' }));
      } catch (error) {
        console.error('Data channel send error:', error);
        setDataStats((prev) => ({
          ...prev,
          lastError: error instanceof Error ? error.message : 'Unknown send error',
        }));
      }
    },
    [sendData],
  );

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
          const currentTimestamp = current.timestamp; // Use timestamp from the current object
          const latestTimestamp = latest.timestamp;   // Use timestamp from latest object
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

  // Request the current whiteboard state once connected (helps late joiners)
  useEffect(() => {
    if (!room) return;

    const requestScene = async () => {
      if (requestedSceneRef.current) return;
      requestedSceneRef.current = true;
      
      // Wait a random delay to avoid request collisions
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      try {
        const message = { 
          type: 'excalidraw_request',
          requestId: Date.now() + Math.random().toString(36).substr(2, 9)
        };
        await sendDataSafe(new TextEncoder().encode(JSON.stringify(message)));
      } catch (error) {
        console.error('Error requesting excalidraw state:', error);
        requestedSceneRef.current = false; // Allow retry on error
      }
    };

    const handleConnectionState = (state: string) => {
      if (state === 'connected') {
        requestScene();
      }
    };

    room.on('connectionStateChanged', handleConnectionState);
    if (room.state === 'connected') {
      requestScene();
    }

    return () => {
      room.off('connectionStateChanged', handleConnectionState);
    };
  }, [room, sendDataSafe]);

  useEffect(() => {
    if (isExcalidrawReady && pendingSceneRef.current) {
      applyExcalidrawScene(pendingSceneRef.current);
      pendingSceneRef.current = null;
    }
  }, [isExcalidrawReady, applyExcalidrawScene]);

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
      const sanitizeFileName = (fileName: string): string => {
        // Remove path traversal attempts
        const basename = fileName.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
        
        // Remove non-ASCII characters and problematic characters
        const sanitized = basename.replace(/[^\w\u00C0-\u00FF\-_. ]/g, '-');
        
        // Trim length (max 255 chars for most filesystems)
        const trimmed = sanitized.substring(0, 255);
        
        // Remove Windows reserved names
        const windowsReserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                                'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                                'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        
        const nameWithoutExt = trimmed.split('.').slice(0, -1).join('.');
        if (windowsReserved.includes(nameWithoutExt.toUpperCase())) {
          return `file-${Date.now()}-${trimmed}`;
        }
        
        return trimmed;
      };
      const safeName = sanitizeFileName(file.name);
      const filePath = `session-files/${Date.now()}-${safeName}`;
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
      await sendDataSafe(new TextEncoder().encode(JSON.stringify(message)));
      
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
      {/* Whiteboard/file/screen content within a smaller bezel */}
      <div
        className="absolute rounded-3xl overflow-hidden bg-white shadow-2xl z-0"
        style={{ top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }}
      >
        {activeView === 'whiteboard' && (
          <ExcalidrawWhiteboard
            sendData={sendDataSafe}
            excalidrawRef={excalidrawRef}
            onReady={() => setIsExcalidrawReady(true)}
          />
        )}
        {activeView === 'file' && sharedFile && (
          <FileViewer
            file={sharedFile}
            onClose={() => setActiveView('whiteboard')}
          />
        )}
        {activeView === 'screen' && screenTrackRef && <ScreenView trackRef={screenTrackRef} />}
      </div>

      {/* Data channel debug */}
      {/* <div className="absolute top-4 left-4 rounded-xl bg-black/40 text-white text-xs px-3 py-2 backdrop-blur shadow-lg">
        <div>Data sent: {dataStats.sent}</div>
        <div>Data received: {dataStats.received}</div>
        {dataStats.lastType && <div>Last type: {dataStats.lastType}</div>}
        {dataStats.lastFrom && <div>Last from: {dataStats.lastFrom}</div>}
        {dataStats.lastError && <div className="text-red-300">Send error: {dataStats.lastError}</div>}
      </div> */}

      {/* Top-right view toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {sharedFile && (
          <button
            onClick={() => setActiveView('file')}
            aria-label="File"
            title="File"
            className={`p-2.5 rounded-2xl backdrop-blur shadow-lg border transition-colors ${activeView==='file' ? 'bg-blue-600/90 text-white border-blue-300' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </button>
        )}
        {screenTrackRef && (
          <button
            onClick={() => setActiveView('screen')}
            aria-label="Screen"
            title="Screen"
            className={`p-2.5 rounded-2xl backdrop-blur shadow-lg border transition-colors ${activeView==='screen' ? 'bg-blue-600/90 text-white border-blue-300' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <path d="M8 21h8m-4-4v4" />
            </svg>
          </button>
        )}
      </div>

      {/* Right-side floating cams */}
      <FloatingVideos allScreenShares={allScreenShares} screenTrackRef={screenTrackRef} onSelectScreenShare={setScreenTrackRef} />

      {/* Bottom center toolbar */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          aria-label="Share file"
          title="Share file"
          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur shadow-lg disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 16v6m-4-2h8" />
            <path d="M21.44 11.05A5 5 0 0 0 17 7h-1.26A8 8 0 1 0 12 21" />
          </svg>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button 
          onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare} 
          disabled={isSending || !compatibilityStatus.isSupported}
          aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          title={compatibilityStatus.isSupported ? (isScreenSharing ? 'Stop sharing' : 'Share screen') : (compatibilityStatus.reason || 'Screen sharing is not supported.')}
          className={`p-2.5 rounded-2xl border backdrop-blur shadow-lg disabled:opacity-50 ${isScreenSharing ? 'bg-red-600/90 text-white border-red-300 hover:bg-red-600' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
        >
          {isScreenSharing ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <path d="M8 21h8m-4-4v4" />
            </svg>
          )}
        </button>
        {onDisconnect && (
          <button
            onClick={onDisconnect}
            aria-label="End session"
            title="End session"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

const Excalidraw = dynamic(
  async () => {
    try {
      const mod = await import('@excalidraw/excalidraw');
      return mod.Excalidraw;
    } catch (e) {
      console.error('Excalidraw dynamic import failed:', e);
      // Return a fallback component
      return () => (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Whiteboard failed to load</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
  },
  { 
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-white">Loading whiteboard...</div>
  }
);

// Error boundary for Excalidraw
class ExcalidrawErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Excalidraw error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Failed to load whiteboard</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ExcalidrawWhiteboard({
  sendData,
  excalidrawRef,
  onReady,
}: {
  sendData: (data: Uint8Array) => Promise<void>;
  excalidrawRef: React.MutableRefObject<any | null>;
  onReady?: () => void;
}) {
  const lastSentVersion = React.useRef(0);
  const debounceRef = React.useRef<number | null>(null);

  // CSS is already loaded via /public/excalidraw.css in layout.tsx

  const sanitizeFilesForSending = React.useCallback((files: any) => {
    const safeFiles: Record<string, any> = {};
    if (!files) return safeFiles;
    Object.entries(files as Record<string, any>).forEach(([id, file]) => {
      if (!file) return;
      safeFiles[id] = {
        id,
        dataURL: file.dataURL,
        mimeType: file.mimeType,
        created: file.created,
        lastRetrieved: file.lastRetrieved,
      };
    });
    return safeFiles;
  }, []);

  const onChange = React.useCallback(
    (elements: any[], _appState: any, _filesFromCallback: any) => {
      // Debounce + only send if changed
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        try {
          const clean = (elements || []).filter((el: any) => !el.isDeleted);
          const version = getSceneVersion(clean as any);
          if (version <= lastSentVersion.current) return;
          lastSentVersion.current = version;

          // Always pull and sanitize the latest files map from the Excalidraw API
          // so that we only send JSON-serializable data (id, dataURL, mimeType, ...).
          const api = excalidrawRef.current;
          const rawFiles = api?.getFiles?.() || {};
          const files = sanitizeFilesForSending(rawFiles);

          const message = {
            type: 'excalidraw_update',
            payload: {
              elements: clean,
              files,
            },
          };
          await sendData(new TextEncoder().encode(JSON.stringify(message)));
        } catch (e) {
          console.error('Error broadcasting excalidraw update:', e);
        }
      }, 120);
    },
    [sendData, sanitizeFilesForSending],
  );

  return (
    <ExcalidrawErrorBoundary>
      <div className="w-full h-full bg-white">
        <Excalidraw
          excalidrawAPI={(api: any) => {
            excalidrawRef.current = api;
            onReady?.();
          }}
          onChange={(elements: readonly any[], appState: any, files: any) =>
            onChange(elements as any[], appState, files)
          }
          theme="light"
          UIOptions={{ dockedSidebarBreakpoint: 0 }}
        />
      </div>
    </ExcalidrawErrorBoundary>
  );
}

interface FloatingVideosProps {
  allScreenShares: Array<TrackReference & { timestamp: number; participantIdentity: string }>;
  screenTrackRef: TrackReference | null;
  onSelectScreenShare: (trackRef: TrackReference) => void;
}

function FloatingVideos({ allScreenShares, screenTrackRef, onSelectScreenShare }: FloatingVideosProps) {
  const tracks = useTracks();
  const videoTracks = tracks.filter((track) => track.publication.kind === 'video');

  const [positions, setPositions] = React.useState<Record<string, { x: number; y: number }>>({});
  const [hidden, setHidden] = React.useState<Record<string, boolean>>({});
  const dragRef = React.useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const pos = positions[id] || { x: window.innerWidth - 220, y: window.innerHeight / 2 - 80 };
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const nx = drag.origX + (e.clientX - drag.startX);
    const ny = drag.origY + (e.clientY - drag.startY);
    setPositions((prev) => ({ ...prev, [drag.id]: { x: nx, y: ny } }));
  };

  const onMouseUp = () => {
    dragRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  React.useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const isParticipantSharingScreen = (participantIdentity: string) =>
    allScreenShares.some(share => share.participantIdentity === participantIdentity);

  const getParticipantScreenShare = (participantIdentity: string) =>
    allScreenShares.find(share => share.participantIdentity === participantIdentity);

  const absoluteTiles = videoTracks.filter((t) => positions[t.publication.trackSid]);
  const dockedTiles = videoTracks.filter((t) => !positions[t.publication.trackSid]);

  return (
    <>
      {/* Absolute (undocked) tiles */}
      {absoluteTiles.map((trackRef: TrackReference) => {
        const id = trackRef.publication.trackSid;
        if (hidden[id]) return null;
        const pos = positions[id]!;
        const participantIdentity = trackRef.participant.identity || 'unknown';
        const sharing = isParticipantSharingScreen(participantIdentity);
        const participantShare = getParticipantScreenShare(participantIdentity);
        const isActive = screenTrackRef?.publication.trackSid === participantShare?.publication.trackSid;
        return (
          <div key={id} className="pointer-events-auto fixed z-50" style={{ left: pos.x, top: pos.y, width: 180, height: 132 }}>
            <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur shadow-2xl">
              <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Drag handle */}
              <div onMouseDown={(e) => onMouseDown(e, id)} className="absolute top-0 left-0 right-0 h-6 bg-black/20 cursor-move" />
              {/* Hide button */}
              <button onClick={() => setHidden((h) => ({ ...h, [id]: true }))} className="absolute top-1 right-1 p-1 bg-black/40 rounded-md text-white" title="Hide">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              {/* Label */}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white">{participantIdentity}</div>
              {/* Screen share indicator + switch */}
              {sharing && (
                <button onClick={() => participantShare && onSelectScreenShare(participantShare)} className={`absolute top-1 left-1 px-2 py-1 rounded-md text-[10px] font-semibold shadow ${isActive ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`} title={isActive ? 'Viewing screen' : `View ${participantIdentity}'s screen`}>
                  {isActive ? 'LIVE' : 'SCREEN'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Docked column on right for remaining tiles */}
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        {dockedTiles.map((trackRef: TrackReference) => {
          const id = trackRef.publication.trackSid;
          if (hidden[id]) return null;
          const participantIdentity = trackRef.participant.identity || 'unknown';
          const sharing = isParticipantSharingScreen(participantIdentity);
          const participantShare = getParticipantScreenShare(participantIdentity);
          const isActive = screenTrackRef?.publication.trackSid === participantShare?.publication.trackSid;
          return (
            <div key={id} className="relative pointer-events-auto w-[180px] h-[132px] rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur shadow-2xl">
              <VideoTrack trackRef={trackRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Drag handle to undock */}
              <div onMouseDown={(e) => onMouseDown(e, id)} className="absolute top-0 left-0 right-0 h-6 bg-black/20 cursor-move" title="Drag to undock" />
              {/* Hide button */}
              <button onClick={() => setHidden((h) => ({ ...h, [id]: true }))} className="absolute top-1 right-1 p-1 bg-black/40 rounded-md text-white" title="Hide">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
              {/* Label */}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white">{participantIdentity}</div>
              {/* Screen share indicator + switch */}
              {sharing && (
                <button onClick={() => participantShare && onSelectScreenShare(participantShare)} className={`absolute top-1 left-1 px-2 py-1 rounded-md text-[10px] font-semibold shadow ${isActive ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'}`} title={isActive ? 'Viewing screen' : `View ${participantIdentity}'s screen`}>
                  {isActive ? 'LIVE' : 'SCREEN'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Restore hidden cams button */}
      {Object.values(hidden).some(Boolean) && (
        <button
          onClick={() => setHidden({})}
          className="pointer-events-auto fixed right-4 bottom-4 p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur shadow-2xl z-50"
          title="Show hidden cams"
          aria-label="Show hidden cams"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      )}
    </>
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

function FileViewer({
  file,
  onClose,
}: {
  file: { url: string; name: string; type: string };
  onClose?: () => void;
}) {
  const isImage = file.type.startsWith('image/');
  return (
    <div className="w-full h-full relative flex items-center justify-center bg-gray-700">
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close file view"
          title="Close file view"
          className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-lg"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      {isImage ? (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <div className="text-center text-white">
          <h3 className="text-2xl font-bold">{file.name}</h3>
          <p className="text-gray-300 mt-2">
            File type not supported for preview
          </p>
          <a
            href={file.url}
            download={file.name}
            className="text-blue-300 hover:underline mt-4 inline-block"
          >
            Download File
          </a>
        </div>
      )}
    </div>
  );
}

export default LiveKitRoom; 
