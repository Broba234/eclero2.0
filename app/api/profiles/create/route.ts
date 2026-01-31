import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { id, email, name, role, profile_setup } = body;

    if (!id || !email || !name || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const profile = await prisma.profiles.create({
      data: {
        id,
        email,
        name,
        role,
        profile_setup: profile_setup ?? false
      }
    });

    return NextResponse.json(profile);

  } catch (error) {
    console.error("[API] Profile creation failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}