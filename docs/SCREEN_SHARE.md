# Screen Share Implementation

This document describes the screen sharing functionality implemented using the LiveKit SDK.

## Overview

The screen sharing feature allows participants in a LiveKit room to share their screen with other participants. The implementation includes comprehensive error handling for permission denials, unsupported browsers, and other edge cases.

## Files

- `lib/screenShare.ts` - Core screen sharing helper functions
- `lib/toast.ts` - Toast notification utilities for user feedback
- `components/LiveKitRoom.tsx` - Updated with screen sharing UI and integration

## Functions

### `startScreenShare(room: Room | null): Promise<boolean>`

Starts screen sharing using the LiveKit SDK.

**Features:**
- Uses `createLocalTracks({screen: true})` to obtain display media
- Checks browser support before attempting to start
- Prevents multiple simultaneous screen shares
- Comprehensive error handling for various failure scenarios
- User-friendly error messages via toast notifications

**Error Handling:**
- `NotAllowedError` - Permission denied by user
- `NotSupportedError` - Browser doesn't support screen sharing
- `NotFoundError` - No screen sources available
- `AbortError` - User cancelled the screen share dialog
- Connection errors - No active room connection

### `stopScreenShare(room: Room | null): Promise<boolean>`

Stops screen sharing and cleans up tracks gracefully.

**Features:**
- Unpublishes screen share tracks from the room
- Properly stops and detaches tracks to free resources
- Error handling for edge cases
- Success/error notifications

### `isScreenSharing(room: Room | null): boolean`

Utility function to check if screen sharing is currently active.

### `startScreenShareAlt(room: Room | null): Promise<boolean>`

Alternative implementation that attempts to use `Room.startScreenShare()` if available, with fallback to the standard implementation.

## UI Integration

The screen sharing functionality is integrated into the LiveKit room component with:

- **Start Screen Share** button - Blue button that appears when not sharing
- **Stop Screen Share** button - Red button that appears when sharing is active
- Visual feedback with icons and clear labels
- Proper button state management based on current sharing status

## Usage Example

```typescript
import { startScreenShare, stopScreenShare, isScreenSharing } from '@/lib/screenShare';

// Start screen sharing
const startSharing = async () => {
  const success = await startScreenShare(room);
  if (success) {
    console.log('Screen sharing started');
  }
};

// Stop screen sharing
const stopSharing = async () => {
  const success = await stopScreenShare(room);
  if (success) {
    console.log('Screen sharing stopped');
  }
};

// Check if currently sharing
const isSharing = isScreenSharing(room);
```

## Error Messages

The implementation provides user-friendly error messages for common scenarios:

- **Permission Denied**: "Screen sharing permission was denied. Please allow screen sharing and try again."
- **Not Supported**: "Screen sharing is not supported in this browser"
- **No Sources**: "No screen sources available for sharing"
- **Cancelled**: "Screen sharing was cancelled"
- **Already Active**: "Screen sharing is already active"
- **No Room**: "No active room connection found"

## Browser Support

Screen sharing requires browsers that support the `getDisplayMedia` API:
- Chrome 72+
- Firefox 66+
- Safari 13+
- Edge 79+

## Notes

- Screen audio sharing is currently disabled but can be enabled by setting `audio: true` in `createLocalTracks`
- The toast notification system uses browser alerts by default but can be easily replaced with a proper toast library
- All functions are wrapped in try/catch blocks for robust error handling
- Console logging is included for debugging purposes
- The implementation follows LiveKit best practices for track management
