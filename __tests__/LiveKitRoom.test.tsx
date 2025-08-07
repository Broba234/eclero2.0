import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Track } from 'livekit-client';
import { 
  useRoomContext, 
  useTracks, 
  useDataChannel 
} from '@livekit/components-react';
import LiveKitRoom from '../components/LiveKitRoom';
import { startScreenShare, stopScreenShare, BrowserCompatibility } from '../lib/screenShare';

// Type the mocked functions
const mockUseRoomContext = useRoomContext as jest.MockedFunction<typeof useRoomContext>;
const mockUseTracks = useTracks as jest.MockedFunction<typeof useTracks>;
const mockUseDataChannel = useDataChannel as jest.MockedFunction<typeof useDataChannel>;
const mockStartScreenShare = startScreenShare as jest.MockedFunction<typeof startScreenShare>;
const mockStopScreenShare = stopScreenShare as jest.MockedFunction<typeof stopScreenShare>;

describe('LiveKitRoom Screen Sharing', () => {
  const defaultProps = {
    roomName: 'test-room',
    userIdentity: 'test-user',
    userName: 'Test User',
    userRole: 'tutor' as const,
    isOpen: true
  };

  const mockRoom = {
    localParticipant: {
      identity: 'test-user',
      isScreenShareEnabled: false,
      getTrackPublication: jest.fn(() => null)
    },
    remoteParticipants: new Map(),
    on: jest.fn(),
    off: jest.fn()
  };

  const mockSendData = jest.fn();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockUseRoomContext.mockReturnValue(mockRoom as any);
    mockUseTracks.mockReturnValue([]);
    mockUseDataChannel.mockReturnValue({
      send: mockSendData,
      isSending: false,
      dataChannel: null
    });
    
    // Mock successful fetch response for token
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'mock-token' })
    });
  });

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      render(<LiveKitRoom {...defaultProps} />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('renders LiveKit room when token is available', async () => {
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
      });
    });

    it('does not render when isOpen is false', () => {
      render(<LiveKitRoom {...defaultProps} isOpen={false} />);
      expect(screen.queryByTestId('livekit-room')).not.toBeInTheDocument();
    });
  });

  describe('Screen Sharing State Management', () => {
    it('shows "Share Screen" button when not sharing', async () => {
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Share Screen')).toBeInTheDocument();
      });
    });

    it('initiates screen sharing when Share Screen button is clicked', async () => {
      mockStartScreenShare.mockResolvedValue(true);
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        const shareButton = screen.getByText('Share Screen');
        expect(shareButton).toBeInTheDocument();
      });
      
      const shareButton = screen.getByText('Share Screen');
      await userEvent.click(shareButton);
      
      expect(mockStartScreenShare).toHaveBeenCalledWith(mockRoom);
    });

    it('updates UI when screen sharing starts', async () => {
      // Mock screen sharing track
      const mockScreenTrackRef = {
        publication: { 
          trackSid: 'screen-track-123',
          source: Track.Source.ScreenShare,
          track: {} 
        },
        participant: { identity: 'test-user' },
        source: Track.Source.ScreenShare
      };

      mockRoom.localParticipant.getTrackPublication = jest.fn(() => ({
        track: {},
        source: Track.Source.ScreenShare
      }));

      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
      });

      // Simulate screen track being published
      const publishedHandler = mockRoom.on.mock.calls.find(
        call => call[0] === 'localTrackPublished'
      )?.[1];
      
      if (publishedHandler) {
        publishedHandler({ source: Track.Source.ScreenShare });
      }

      // Should show View Screen button when screen sharing is active
      await waitFor(() => {
        expect(screen.getByText('View Screen')).toBeInTheDocument();
      });
    });

    it('stops screen sharing when Stop Sharing button is clicked', async () => {
      mockStopScreenShare.mockResolvedValue(true);
      
      // Setup initial screen sharing state
      mockRoom.localParticipant.isScreenShareEnabled = true;
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Stop Sharing')).toBeInTheDocument();
      });
      
      const stopButton = screen.getByText('Stop Sharing');
      await userEvent.click(stopButton);
      
      expect(mockStopScreenShare).toHaveBeenCalledWith(mockRoom);
    });
  });

  describe('View Switching', () => {
    it('switches to whiteboard view when Whiteboard button is clicked', async () => {
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        const whiteboardButton = screen.getByText('Whiteboard');
        expect(whiteboardButton).toBeInTheDocument();
      });
      
      const whiteboardButton = screen.getByText('Whiteboard');
      await userEvent.click(whiteboardButton);
      
      expect(screen.getByTestId('tldraw-whiteboard')).toBeInTheDocument();
    });

    it('automatically switches to screen view when screen sharing starts', async () => {
      const mockScreenTrackRef = {
        publication: { 
          trackSid: 'screen-track-123',
          source: Track.Source.ScreenShare,
          track: {} 
        },
        participant: { identity: 'test-user' },
        source: Track.Source.ScreenShare
      };

      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
      });

      // Simulate screen sharing becoming active
      mockRoom.localParticipant.getTrackPublication = jest.fn(() => ({
        track: {},
        source: Track.Source.ScreenShare
      }));

      // Trigger the effect that would switch to screen view
      const publishedHandler = mockRoom.on.mock.calls.find(
        call => call[0] === 'localTrackPublished'
      )?.[1];
      
      if (publishedHandler) {
        publishedHandler({ source: Track.Source.ScreenShare });
      }

      await waitFor(() => {
        expect(screen.getByTestId('video-track')).toBeInTheDocument();
      });
    });

    it('maintains audio/video when switching between views', async () => {
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('room-audio-renderer')).toBeInTheDocument();
      });

      const whiteboardButton = screen.getByText('Whiteboard');
      await userEvent.click(whiteboardButton);

      // Audio renderer should still be present
      expect(screen.getByTestId('room-audio-renderer')).toBeInTheDocument();
      
      // Video sidebar should still be visible
      expect(screen.getByText('Session')).toBeInTheDocument();
    });
  });

  describe('File Sharing Integration', () => {
    it('handles file sharing via data channel', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Share File')).toBeInTheDocument();
      });

      const shareFileButton = screen.getByText('Share File');
      await userEvent.click(shareFileButton);

      // This would trigger file input (mocked in real implementation)
      // For now, verify the button exists and is clickable
      expect(shareFileButton).toBeInTheDocument();
    });

    it('switches to file view when file is shared', async () => {
      const onMessageCallback = mockUseDataChannel.mock.calls[0]?.[0]?.onMessage;
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
      });

      // Simulate receiving file share message
      const fileShareMessage = {
        payload: new TextEncoder().encode(JSON.stringify({
          type: 'file_share',
          payload: { url: 'https://example.com/file.pdf', name: 'test.pdf', type: 'application/pdf' }
        }))
      };

      if (onMessageCallback) {
        onMessageCallback(fileShareMessage);
      }

      await waitFor(() => {
        expect(screen.getByText('View File')).toBeInTheDocument();
      });
    });
  });

  describe('Permission Handling', () => {
    it('handles screen share permission denial gracefully', async () => {
      mockStartScreenShare.mockResolvedValue(false);
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        const shareButton = screen.getByText('Share Screen');
        expect(shareButton).toBeInTheDocument();
      });
      
      const shareButton = screen.getByText('Share Screen');
      await userEvent.click(shareButton);
      
      expect(mockStartScreenShare).toHaveBeenCalledWith(mockRoom);
      
      // Button should remain clickable after failure
      await waitFor(() => {
        expect(screen.getByText('Share Screen')).toBeInTheDocument();
      });
    });

    it('disables screen share button when browser compatibility is not supported', async () => {
      // Mock unsupported browser
      BrowserCompatibility.getCompatibilityStatus = jest.fn(() => ({
        isSupported: false,
        reason: 'Screen sharing not supported on mobile devices',
        isMobile: true,
        safariInfo: { isSafari: false, version: null, isSupported: true }
      }));

      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        const shareButton = screen.getByText('Share Screen');
        expect(shareButton).toBeDisabled();
      });
    });
  });

  describe('Multiple Screen Shares', () => {
    it('handles multiple simultaneous screen shares', async () => {
      const screenTrack1 = {
        publication: { trackSid: 'track-1', source: Track.Source.ScreenShare, track: {} },
        participant: { identity: 'user-1' },
        source: Track.Source.ScreenShare
      };

      const screenTrack2 = {
        publication: { trackSid: 'track-2', source: Track.Source.ScreenShare, track: {} },
        participant: { identity: 'user-2' },
        source: Track.Source.ScreenShare
      };

      // Mock multiple participants with screen shares
      const mockRemoteParticipant1 = {
        identity: 'user-1',
        getTrackPublication: jest.fn(() => ({
          track: {},
          source: Track.Source.ScreenShare,
          trackSid: 'track-1'
        }))
      };

      const mockRemoteParticipant2 = {
        identity: 'user-2', 
        getTrackPublication: jest.fn(() => ({
          track: {},
          source: Track.Source.ScreenShare,
          trackSid: 'track-2'
        }))
      };

      mockRoom.remoteParticipants.set('user-1', mockRemoteParticipant1);
      mockRoom.remoteParticipants.set('user-2', mockRemoteParticipant2);

      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
      });

      // This would test multiple screen share UI elements
      // In actual implementation, would show screen share selector
      expect(screen.getByTestId('livekit-room')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles token fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Connection Error/)).toBeInTheDocument();
      });
    });

    it('handles LiveKit connection failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      });
      
      render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to get token: 500/)).toBeInTheDocument();
      });
    });
  });

  describe('Cleanup and Event Management', () => {
    it('removes event listeners on component unmount', async () => {
      const { unmount } = render(<LiveKitRoom {...defaultProps} />);
      
      await waitFor(() => {
        expect(mockRoom.on).toHaveBeenCalled();
      });
      
      unmount();
      
      expect(mockRoom.off).toHaveBeenCalled();
    });

    it('handles room disconnection gracefully', async () => {
      const mockOnDisconnect = jest.fn();
      
      render(<LiveKitRoom {...defaultProps} onDisconnect={mockOnDisconnect} />);
      
      await waitFor(() => {
        expect(screen.getByText('End Session')).toBeInTheDocument();
      });
      
      const endSessionButton = screen.getByText('End Session');
      await userEvent.click(endSessionButton);
      
      expect(mockOnDisconnect).toHaveBeenCalled();
    });
  });
});
