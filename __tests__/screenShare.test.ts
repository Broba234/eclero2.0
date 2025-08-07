import { 
  startScreenShare, 
  stopScreenShare, 
  isScreenSharing, 
  BrowserCompatibility,
  showError,
  showSuccess 
} from '../lib/screenShare';
import { Room } from 'livekit-client';

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
};

// Mock alert
global.alert = jest.fn();

describe('BrowserCompatibility', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    // Restore original user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
  });

  describe('isGetDisplayMediaSupported', () => {
    it('returns true when getDisplayMedia is available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getDisplayMedia: jest.fn() },
        writable: true
      });

      expect(BrowserCompatibility.isGetDisplayMediaSupported()).toBe(true);
    });

    it('returns false when mediaDevices is not available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });

      expect(BrowserCompatibility.isGetDisplayMediaSupported()).toBe(false);
    });

    it('returns false when getDisplayMedia is not available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {},
        writable: true
      });

      expect(BrowserCompatibility.isGetDisplayMediaSupported()).toBe(false);
    });
  });

  describe('isMobile', () => {
    it('returns true for Android user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36',
        writable: true
      });

      expect(BrowserCompatibility.isMobile()).toBe(true);
    });

    it('returns true for iPhone user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      expect(BrowserCompatibility.isMobile()).toBe(true);
    });

    it('returns false for desktop Chrome user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });

      expect(BrowserCompatibility.isMobile()).toBe(false);
    });
  });

  describe('getSafariInfo', () => {
    it('returns correct info for Safari 16', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Safari/537.36',
        writable: true
      });

      const safariInfo = BrowserCompatibility.getSafariInfo();
      expect(safariInfo.isSafari).toBe(true);
      expect(safariInfo.version).toBe(16);
      expect(safariInfo.isSupported).toBe(true);
    });

    it('returns correct info for Safari 15', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/15.0 Safari/537.36',
        writable: true
      });

      const safariInfo = BrowserCompatibility.getSafariInfo();
      expect(safariInfo.isSafari).toBe(true);
      expect(safariInfo.version).toBe(15);
      expect(safariInfo.isSupported).toBe(false);
    });

    it('returns correct info for Chrome', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });

      const safariInfo = BrowserCompatibility.getSafariInfo();
      expect(safariInfo.isSafari).toBe(false);
      expect(safariInfo.version).toBe(null);
      expect(safariInfo.isSupported).toBe(true);
    });
  });

  describe('getCompatibilityStatus', () => {
    it('returns unsupported for mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      const status = BrowserCompatibility.getCompatibilityStatus();
      expect(status.isSupported).toBe(false);
      expect(status.reason).toContain('mobile devices');
      expect(status.isMobile).toBe(true);
    });

    it('returns unsupported for old Safari versions', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/15.0 Safari/537.36',
        writable: true
      });
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getDisplayMedia: jest.fn() },
        writable: true
      });

      const status = BrowserCompatibility.getCompatibilityStatus();
      expect(status.isSupported).toBe(false);
      expect(status.reason).toContain('Safari 16 or later');
      expect(status.isMobile).toBe(false);
    });

    it('returns supported for modern browsers', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true
      });
      
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getDisplayMedia: jest.fn() },
        writable: true
      });

      const status = BrowserCompatibility.getCompatibilityStatus();
      expect(status.isSupported).toBe(true);
      expect(status.reason).toBeUndefined();
      expect(status.isMobile).toBe(false);
    });
  });
});

describe('Screen Share Functions', () => {
  let mockRoom: jest.Mocked<Room>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRoom = {
      localParticipant: {
        isScreenShareSupported: jest.fn().mockReturnValue(true),
        setScreenShareEnabled: jest.fn(),
        isScreenShareEnabled: false
      }
    } as any;
  });

  describe('startScreenShare', () => {
    it('successfully starts screen sharing', async () => {
      mockRoom.localParticipant.setScreenShareEnabled.mockResolvedValue(undefined);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(true);
      expect(mockRoom.localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(true);
      expect(consoleSpy.log).toHaveBeenCalledWith('Screen share started successfully');
    });

    it('returns false when room is null', async () => {
      const result = await startScreenShare(null);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('No active room connection found')
      );
    });

    it('returns false when screen sharing is not supported', async () => {
      mockRoom.localParticipant.isScreenShareSupported.mockReturnValue(false);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('not supported in this browser')
      );
    });

    it('handles NotAllowedError (permission denied)', async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValue(error);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('permission was denied')
      );
    });

    it('handles NotFoundError (no screen selected)', async () => {
      const error = new Error('No screen selected');
      error.name = 'NotFoundError';
      mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValue(error);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('No screen or window was selected')
      );
    });

    it('handles NotSupportedError', async () => {
      const error = new Error('Not supported');
      error.name = 'NotSupportedError';
      mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValue(error);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('not supported in this browser')
      );
    });

    it('handles generic errors', async () => {
      const error = new Error('Generic error');
      mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValue(error);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Generic error')
      );
    });

    it('handles permission-related error messages', async () => {
      const error = new Error('Permission denied by user');
      mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValue(error);

      const result = await startScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('permission was denied')
      );
    });
  });

  describe('stopScreenShare', () => {
    it('successfully stops screen sharing', async () => {
      mockRoom.localParticipant.isScreenShareEnabled = true;
      mockRoom.localParticipant.setScreenShareEnabled.mockResolvedValue(undefined);

      const result = await stopScreenShare(mockRoom);

      expect(result).toBe(true);
      expect(mockRoom.localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(false);
      expect(consoleSpy.log).toHaveBeenCalledWith('Screen share stopped successfully');
    });

    it('returns false when room is null', async () => {
      const result = await stopScreenShare(null);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('No active room connection found')
      );
    });

    it('returns true when no screen share is active', async () => {
      mockRoom.localParticipant.isScreenShareEnabled = false;

      const result = await stopScreenShare(mockRoom);

      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith('No active screen share to stop.');
    });

    it('handles errors when stopping screen share', async () => {
      mockRoom.localParticipant.isScreenShareEnabled = true;
      const error = new Error('Stop failed');
      mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValue(error);

      const result = await stopScreenShare(mockRoom);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Stop failed')
      );
    });
  });

  describe('isScreenSharing', () => {
    it('returns true when screen sharing is enabled', () => {
      mockRoom.localParticipant.isScreenShareEnabled = true;

      const result = isScreenSharing(mockRoom);

      expect(result).toBe(true);
    });

    it('returns false when screen sharing is not enabled', () => {
      mockRoom.localParticipant.isScreenShareEnabled = false;

      const result = isScreenSharing(mockRoom);

      expect(result).toBe(false);
    });

    it('returns false when room is null', () => {
      const result = isScreenSharing(null);

      expect(result).toBe(false);
    });
  });

  describe('showError and showSuccess', () => {
    it('shows error message correctly', () => {
      const error = {
        type: 'permission_denied' as const,
        message: 'Permission denied'
      };

      showError(error);

      expect(consoleSpy.error).toHaveBeenCalledWith('[Screen Share Error] Permission denied');
      expect(global.alert).toHaveBeenCalledWith('[Screen Share Error] Permission denied');
    });

    it('shows success message correctly', () => {
      showSuccess('Screen sharing started');

      expect(consoleSpy.log).toHaveBeenCalledWith('[Screen Share] Screen sharing started');
    });
  });
});

describe('Integration Tests', () => {
  let mockRoom: jest.Mocked<Room>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRoom = {
      localParticipant: {
        isScreenShareSupported: jest.fn().mockReturnValue(true),
        setScreenShareEnabled: jest.fn(),
        isScreenShareEnabled: false
      }
    } as any;

    // Setup compatible browser environment
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      writable: true
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getDisplayMedia: jest.fn() },
      writable: true
    });
  });

  it('handles complete screen sharing lifecycle', async () => {
    // Check compatibility first
    const compatibility = BrowserCompatibility.getCompatibilityStatus();
    expect(compatibility.isSupported).toBe(true);

    // Start screen sharing
    mockRoom.localParticipant.setScreenShareEnabled.mockResolvedValueOnce(undefined);
    const startResult = await startScreenShare(mockRoom);
    expect(startResult).toBe(true);

    // Update state to reflect active screen sharing
    mockRoom.localParticipant.isScreenShareEnabled = true;

    // Check if screen sharing is active
    const isActive = isScreenSharing(mockRoom);
    expect(isActive).toBe(true);

    // Stop screen sharing
    mockRoom.localParticipant.setScreenShareEnabled.mockResolvedValueOnce(undefined);
    const stopResult = await stopScreenShare(mockRoom);
    expect(stopResult).toBe(true);

    // Update state to reflect stopped screen sharing
    mockRoom.localParticipant.isScreenShareEnabled = false;

    // Verify screen sharing is no longer active
    const isStillActive = isScreenSharing(mockRoom);
    expect(isStillActive).toBe(false);
  });

  it('handles permission denied gracefully', async () => {
    // Attempt to start screen sharing but permission is denied
    const permissionError = new Error('User denied permission');
    permissionError.name = 'NotAllowedError';
    mockRoom.localParticipant.setScreenShareEnabled.mockRejectedValueOnce(permissionError);

    const result = await startScreenShare(mockRoom);

    expect(result).toBe(false);
    expect(mockRoom.localParticipant.isScreenShareEnabled).toBe(false);
    expect(isScreenSharing(mockRoom)).toBe(false);
    
    // User should be able to retry
    mockRoom.localParticipant.setScreenShareEnabled.mockResolvedValueOnce(undefined);
    const retryResult = await startScreenShare(mockRoom);
    expect(retryResult).toBe(true);
  });

  it('handles incompatible browsers gracefully', () => {
    // Simulate mobile browser
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true
    });

    const compatibility = BrowserCompatibility.getCompatibilityStatus();
    expect(compatibility.isSupported).toBe(false);
    expect(compatibility.isMobile).toBe(true);
    expect(compatibility.reason).toContain('mobile devices');
  });
});

afterAll(() => {
  // Restore console methods
  consoleSpy.log.mockRestore();
  consoleSpy.error.mockRestore();
});
