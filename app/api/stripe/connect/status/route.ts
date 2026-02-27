import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email parameter is required" }),
        { status: 400 }
      );
    }

    const profile = await prisma.profiles.findUnique({
      where: { email },
      select: { stripe_account_id: true },
    });

    const connected = Boolean(profile?.stripe_account_id);

    return new Response(
      JSON.stringify({
        connected,
        stripe_account_id: profile?.stripe_account_id ?? null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[Stripe Connect] status error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
