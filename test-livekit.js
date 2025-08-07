// Simple LiveKit configuration test
const https = require('https');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

console.log('=== LiveKit Configuration Test ===');
console.log('Server URL:', LIVEKIT_URL);
console.log('API Key exists:', !!API_KEY);
console.log('API Key (first 6 chars):', API_KEY?.substring(0, 6) + '...');
console.log('API Secret exists:', !!API_SECRET);
console.log('API Secret length:', API_SECRET?.length);

if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Test server connectivity
const testServerConnectivity = () => {
  return new Promise((resolve, reject) => {
    console.log('\n=== Testing Server Connectivity ===');
    
    // Extract host from WebSocket URL
    const wsUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
    
    console.log('Testing HTTP connectivity to:', wsUrl);
    
    const req = https.get(wsUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'LiveKit-Test/1.0'
      }
    }, (res) => {
      console.log('✅ Server responded with status:', res.statusCode);
      console.log('Response headers:', res.headers);
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
  console.log('\n=== Testing Token Generation ===');
  
  try {
    // Import the LiveKit SDK
    const { AccessToken } = require('livekit-server-sdk');
    
    const testRoom = 'test-room-' + Date.now();
    const testUser = 'test-user-' + Date.now();
    
    console.log('Creating token for room:', testRoom);
    console.log('Creating token for user:', testUser);
    
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: testUser,
    });
    
    at.addGrant({ 
      roomJoin: true, 
      room: testRoom,
      canPublish: true,
      canSubscribe: true 
    });
    
    console.log('AccessToken object created:', !!at);
    console.log('About to call toJwt()...');
    
    const token = await at.toJwt();
    
    console.log('✅ Token generated successfully');
    console.log('Token type:', typeof token);
    console.log('Token length:', token ? token.length : 'undefined');
    console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token generated');
    
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