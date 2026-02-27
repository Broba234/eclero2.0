import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.warn(
    "[Stripe] STRIPE_SECRET_KEY is not set. Stripe Connect will not work."
  );
}

export const stripe =
  secretKey &&
  new Stripe(secretKey, {
    typescript: true,
  });
