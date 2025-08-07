import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'StudentId parameter is required' }, { status: 400 });
    }

    console.log('Fetching sessions for student:', studentId);

    // Fetch sessions where user is the student
    const { data: sessions, error: fetchError } = await supabase
      .from('Sessions')
      .select(`
        *,
        tutor:tutor_id (
          id,
          name,
          avatar,
          bio,
          hourlyRate
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Student sessions fetch error:', fetchError);
      console.error('Full error details:', JSON.stringify(fetchError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to fetch sessions', 
        details: fetchError.message,
        code: fetchError.code 
      }, { status: 500 });
    }

    console.log('Sessions fetched successfully:', sessions?.length || 0, 'sessions');

    return NextResponse.json({ 
      success: true, 
      sessions: sessions || []
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 