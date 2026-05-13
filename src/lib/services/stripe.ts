import Stripe from "stripe"

let stripeClient: Stripe | null = null

/**
 * Returns a shared Stripe client when STRIPE_SECRET_KEY is configured.
 * Callers must handle a null return in environments where Stripe is intentionally disabled.
 */
export function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeClient
}
