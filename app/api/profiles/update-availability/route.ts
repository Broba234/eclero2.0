import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(req: Request) {
  try {
    const { isAvailableNow, userEmail } = await req.json();

    if (typeof isAvailableNow !== 'boolean') {
      return NextResponse.json({ error: 'isAvailableNow must be a boolean' }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 });
    }

    console.log('[AVAILABILITY_UPDATE] Updating availability for user:', userEmail, 'to:', isAvailableNow);

    const updatedProfile = await prisma.profiles.update({
      where: { email: userEmail },
      data: { isAvailableNow },
      select: { id: true, email: true, isAvailableNow: true }
    });

    console.log('[AVAILABILITY_UPDATE] Successfully updated profile:', updatedProfile);

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('[AVAILABILITY_UPDATE] Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error?.message || error
    }, { status: 500 });
  }
}