import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating session...');

    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tutorId, studentId, topic, notes } = await request.json();
    
    if (!tutorId || !studentId) {
      return NextResponse.json({ error: 'Missing tutorId or studentId' }, { status: 400 });
    }

    console.log('📊 Inserting session data...');

    // Insert new Session
    const { data, error } = await supabase
      .from('Sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        topic: topic || null,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Session creation error:', error);
      return NextResponse.json({ error: 'Failed to create session', details: error.message }, { status: 500 });
    }

    console.log('✅ Session created successfully:', data);
    return NextResponse.json({ 
      success: true, 
      session: data
    });
  } catch (err) {
    console.error('❌ Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
