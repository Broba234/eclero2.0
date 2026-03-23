import { SupabaseClient } from '@supabase/supabase-js';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  sessionId?: string;
  actorId?: string;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
) {
  const { error } = await supabase.from('Notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    session_id: params.sessionId || null,
    actor_id: params.actorId || null,
  });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function notifySessionCreated(
  supabase: SupabaseClient,
  {
    tutorId,
    studentId,
    studentName,
    topic,
    sessionId,
  }: {
    tutorId: string;
    studentId: string;
    studentName: string;
    topic?: string;
    sessionId: string;
  }
) {
  await createNotification(supabase, {
    userId: tutorId,
    type: 'session_requested',
    title: 'New Session Request',
    body: `${studentName} requested a ${topic || 'tutoring'} session.`,
    sessionId,
    actorId: studentId,
  });
}

export async function notifySessionStatusChanged(
  supabase: SupabaseClient,
  {
    sessionId,
    status,
    tutorId,
    studentId,
    actorUserId,
    tutorName,
    studentName,
  }: {
    sessionId: string;
    status: string;
    tutorId: string;
    studentId: string;
    actorUserId: string;
    tutorName: string;
    studentName: string;
  }
) {
  const isTutorAction = actorUserId === tutorId;

  switch (status) {
    case 'accepted':
      // Notify the student that tutor accepted
      await createNotification(supabase, {
        userId: studentId,
        type: 'session_accepted',
        title: 'Session Accepted',
        body: `${tutorName} accepted your session request.`,
        sessionId,
        actorId: tutorId,
      });
      break;

    case 'declined':
      await createNotification(supabase, {
        userId: studentId,
        type: 'session_declined',
        title: 'Session Declined',
        body: `${tutorName} declined your session request.`,
        sessionId,
        actorId: tutorId,
      });
      break;

    case 'in_progress':
      // Notify the other party that session started
      await createNotification(supabase, {
        userId: isTutorAction ? studentId : tutorId,
        type: 'session_started',
        title: 'Session Started',
        body: `Your session with ${isTutorAction ? tutorName : studentName} has started.`,
        sessionId,
        actorId: actorUserId,
      });
      break;

    case 'completed':
      // Notify student that session is completed
      await createNotification(supabase, {
        userId: studentId,
        type: 'session_completed',
        title: 'Session Completed',
        body: `Your session with ${tutorName} has been completed.`,
        sessionId,
        actorId: tutorId,
      });
      break;

    case 'cancelled':
      await createNotification(supabase, {
        userId: isTutorAction ? studentId : tutorId,
        type: 'session_cancelled',
        title: 'Session Cancelled',
        body: `${isTutorAction ? tutorName : studentName} cancelled the session.`,
        sessionId,
        actorId: actorUserId,
      });
      break;
  }
}
