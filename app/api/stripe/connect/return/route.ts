import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function GET() {
  try {
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

    if (stripe) {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      if (!account.details_submitted) {
        // User may need to complete more steps; they can retry from the wizard
      }
    }

    return Response.redirect(new URL("/home/tutor?setup=4", baseUrl));
  } catch (error) {
    console.error("[Stripe Connect] return error:", error);
    return Response.redirect(new URL("/home/tutor?setup=4", baseUrl));
  }
}
