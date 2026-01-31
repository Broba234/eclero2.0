// Simple LiveKit configuration test
const https = require('https');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;


if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Test server connectivity
const testServerConnectivity = () => {
  return new Promise((resolve, reject) => {
    
    // Extract host from WebSocket URL
    const wsUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
    
    
    const req = https.get(wsUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'LiveKit-Test/1.0'
      }
    }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });
    
    req.on('error', (error) => {
      console.error('❌ Server connectivity error:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('❌ Server request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Test token generation
const testTokenGeneration = async () => {
  
  try {
    // Import the LiveKit SDK
    const { AccessToken } = require('livekit-server-sdk');
    
    const testRoom = 'test-room-' + Date.now();
    const testUser = 'test-user-' + Date.now();
    
    
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: testUser,
    });
    
    at.addGrant({ 
      roomJoin: true, 
      room: testRoom,
      canPublish: true,
      canSubscribe: true 
    });
    
    
    const token = await at.toJwt();
  
    
    return { token, room: testRoom, user: testUser };
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    throw error;
  }
};

// Run all tests
const runTests = async () => {
  try {
    // Test 1: Server connectivity
    await testServerConnectivity();
    
    // Test 2: Token generation
    await testTokenGeneration();
    
    console.log('\n🎉 All tests passed! LiveKit configuration appears to be working.');
    console.log('\nNext steps:');
    console.log('1. Try joining a session again');
    console.log('2. Check browser console for detailed debugging info');
    console.log('3. Ensure webcam/microphone permissions are granted');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your LiveKit cloud instance is active');
    console.log('2. Check if API keys are correct and not expired');
    console.log('3. Ensure network connectivity to LiveKit servers');
    process.exit(1);
  }
};

runTests(); 