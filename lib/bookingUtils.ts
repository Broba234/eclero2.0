export interface BookSessionParams {
  tutorId: string;
  studentId: string;
  start_time: string;
  duration: number;
  topic?: string;
  notes?: string;
  date: string;
  amount: any;
}

export interface SessionResponse {
  success: boolean;
  session?: any;
  roomName?: string;
  error?: string;
}

export const bookSession = async (params: BookSessionParams): Promise<SessionResponse> => {

  try {
    const res = await fetch('/api/sessions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorId: params.tutorId,
        studentId: params.studentId,
        start_time: params.start_time,
        duration: params.duration,
        topic: params.topic,
        notes: params.notes,
        date: params.date,
        amount: params.amount,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Failed to book session',
      };
    }

    return {
      success: true,
      session: data.session,
      roomName: data.roomName,
    };
  } catch (error) {
    console.error('Booking error:', error);
    return {
      success: false,
      error: 'Network error occurred while booking session',
    };
  }
};

export const getSessionsByStudent = async () => {
  try {
    const res = await fetch('/api/sessions/student');
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return await res.json();
  } catch (error) {
    console.error('Error fetching student sessions:', error);
    throw error;
  }
};

export const getSessionsByTutor = async () => {
  try {
    const res = await fetch('/api/sessions/tutor');
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return await res.json();
  } catch (error) {
    console.error('Error fetching tutor sessions:', error);
    throw error;
  }
}; 