import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getStripe } from "@/lib/services/stripe"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const stripe = getStripe();
    if (!stripe) {
        console.warn("STRIPE_SECRET_KEY not set, skipping real Stripe call");
        return NextResponse.json({ error: "Stripe configuration missing" }, { status: 500 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    let accountId = user?.payout_account_id

    // If the user doesn't have a Stripe Connect account yet, create one
    if (!accountId) {
      const account = await stripe.accounts.create({
          type: 'express',
          email: user?.email || undefined
      })
      accountId = account.id

      await prisma.user.update({
          where: { id: session.user.id },
          data: { payout_account_id: accountId }
      })
    }

    // Generate the onboarding link
    // Requires a valid NEXTAUTH_URL or base URL to redirect back to
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/creator`,
      return_url: `${baseUrl}/creator`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error("Stripe Onboarding Error:", error)
    return NextResponse.json({ error: "Failed to generate onboarding link" }, { status: 500 })
  }
}
