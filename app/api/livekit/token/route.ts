import { NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const { room, user } = await req.json();

    console.log('=== LiveKit Token API Request ===');
    console.log('Request payload:', { room, user });
    console.log('Environment check:', {
      apiKeyExists: !!process.env.LIVEKIT_API_KEY,
      apiSecretExists: !!process.env.LIVEKIT_API_SECRET,
      apiKeyPrefix: process.env.LIVEKIT_API_KEY?.substring(0, 6) + '...',
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL
    });

    if (!room || !user) {
      console.error('Missing required parameters:', { room: !!room, user: !!user });
      return new Response(JSON.stringify({ 
        error: "Missing room or user",
        details: { roomProvided: !!room, userProvided: !!user }
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;

    if (!apiKey || !apiSecret) {
      console.error('Missing LiveKit credentials:', {
        apiKeyExists: !!apiKey,
        apiSecretExists: !!apiSecret
      });
      return new Response(JSON.stringify({ 
        error: "Missing LiveKit credentials",
        details: "LIVEKIT_API_KEY or LIVEKIT_API_SECRET not configured"
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Creating AccessToken with:', {
      identity: user,
      roomGrant: room,
      apiKeyLength: apiKey.length,
      apiSecretLength: apiSecret.length
    });

    const at = new AccessToken(apiKey, apiSecret, {
      identity: user,
    });
    
    at.addGrant({ 
      roomJoin: true, 
      room,
      canPublish: true,
      canSubscribe: true 
    });

    const token = await at.toJwt();
    
    console.log('LiveKit token generated successfully:', {
      room,
      user,
      tokenType: typeof token,
      tokenLength: token?.length || 'no length',
      tokenPrefix: typeof token === 'string' ? token.substring(0, 20) + '...' : 'not a string'
    });

    return new Response(JSON.stringify({ 
      token,
      serverUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('=== LiveKit Token API Error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({ 
      error: "Failed to generate token",
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}