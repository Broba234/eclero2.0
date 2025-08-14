import '@testing-library/jest-dom';

// Mock LiveKit components and utilities
jest.mock('@livekit/components-react', () => ({
  LiveKitRoom: ({ children }) => <div data-testid="livekit-room">{children}</div>,
  RoomAudioRenderer: () => <div data-testid="room-audio-renderer" />,
  VideoTrack: ({ trackRef, style }) => (
    <div data-testid="video-track" data-track-id={trackRef?.publication?.trackSid} style={style} />
  ),
  useTracks: jest.fn(() => []),
  useDataChannel: jest.fn(() => ({
    send: jest.fn(),
    isSending: false,
    dataChannel: null
  })),
  useRoomContext: jest.fn(() => null),
}));

// Mock livekit-client
jest.mock('livekit-client', () => ({
  Track: {
    Source: {
      ScreenShare: 'screen_share',
      Camera: 'camera',
      Microphone: 'microphone'
    }
  },
  Room: jest.fn().mockImplementation(() => ({
    localParticipant: {
      isScreenShareEnabled: false,
      isScreenShareSupported: jest.fn(() => true),
      setScreenShareEnabled: jest.fn(),
      getTrackPublication: jest.fn(() => null),
      identity: 'test-user'
    },
    remoteParticipants: new Map(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock Excalidraw
jest.mock('@excalidraw/excalidraw', () => ({
  Excalidraw: () => <div data-testid="excalidraw-whiteboard" />
}));

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://mock-url.com/file.png' } }))
      }))
    }
  }
}));

// Mock screen share utilities
jest.mock('@/lib/screenShare', () => ({
  startScreenShare: jest.fn(),
  stopScreenShare: jest.fn(),
  isScreenSharing: jest.fn(() => false),
  showSuccess: jest.fn(),
  showError: jest.fn(),
  BrowserCompatibility: {
    getCompatibilityStatus: jest.fn(() => ({
      isSupported: true,
      isMobile: false,
      safariInfo: { isSafari: false, version: null, isSupported: true }
    }))
  }
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ token: 'mock-token' }),
    text: () => Promise.resolve('OK')
  })
);

// Mock environment variables
process.env.NEXT_PUBLIC_LIVEKIT_URL = 'wss://test-livekit.example.com';

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
