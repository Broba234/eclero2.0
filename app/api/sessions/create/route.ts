import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {

    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { tutorId, studentId, topic, notes, start_time, duration, date, amount } = await request.json();
    
    if (!tutorId || !studentId) {
      return NextResponse.json({ error: 'Missing tutorId or studentId' }, { status: 400 });
    }


    // Insert new Session
    const { data, error } = await supabase
      .from('Sessions')
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
        start_time: start_time,
        duration: duration,
        topic: topic || null,
        notes: notes || null,
        date: date,
        amount: amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create session', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      session: data
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
