import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Remove the availability slot
    await prisma.tutorAvailability.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TA_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}