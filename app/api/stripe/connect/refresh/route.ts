import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function GET() {
  try {
    if (!stripe) {
      return Response.redirect(new URL("/home/tutor?setup=4", baseUrl));
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user?.email) {
      return Response.redirect(new URL("/auth/login", baseUrl));
    }

    const profile = await prisma.profiles.findUnique({
      where: { email: user.email },
    });

    if (!profile?.stripe_account_id) {
      return Response.redirect(new URL("/home/tutor?setup=4", baseUrl));
    }

    const accountLink = await stripe.accountLinks.create({
      account: profile.stripe_account_id,
      refresh_url: `${baseUrl}/api/stripe/connect/refresh`,
      return_url: `${baseUrl}/api/stripe/connect/return`,
      type: "account_onboarding",
    });

    return Response.redirect(accountLink.url);
  } catch (error) {
    console.error("[Stripe Connect] refresh error:", error);
    return Response.redirect(new URL("/home/tutor?setup=4", baseUrl));
  }
}
