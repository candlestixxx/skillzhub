import { prisma } from '../prisma'
import Stripe from "stripe"

// Lazy initialize stripe to prevent Next.js build errors if STRIPE_SECRET_KEY is missing
let stripeClient: Stripe | null = null;
function getStripe() {
    if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
        stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia'
        });
    }
    return stripeClient;
}

export async function processPayouts(submissionId: string) {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { mission: true, creator: true }
    })

    if (!submission || submission.processing_status !== 'ACCEPTED' || !submission.accepted_minutes) {
        throw new Error("Invalid submission for payout")
    }

    if (!submission.creator.payout_account_id) {
         throw new Error("Creator does not have a connected payout account")
    }

    const rate = submission.mission.price_per_minute
    const gross = submission.accepted_minutes * rate
    const platformFee = gross * 0.20 // 20% fee
    const net = gross - platformFee

    const ledger = await prisma.paymentLedger.create({
        data: {
            submission_id: submission.id,
            creator_id: submission.creator_id,
            mission_id: submission.mission_id,
            accepted_minutes: submission.accepted_minutes,
            rate_per_minute: rate,
            gross_amount: gross,
            platform_fee_amount: platformFee,
            net_payout_amount: net,
            payout_status: "pending_transfer"
        }
    })

    const stripe = getStripe();

    if (!stripe) {
        console.warn(`STRIPE_SECRET_KEY missing. Skipping real Stripe Transfer of $${net} to ${submission.creator.payout_account_id}`)
        return ledger;
    }

    try {
        // Stripe amounts are in cents
        const amountInCents = Math.round(net * 100);

        const transfer = await stripe.transfers.create({
            amount: amountInCents,
            currency: 'usd',
            destination: submission.creator.payout_account_id,
            transfer_group: `mission_${submission.mission_id}`,
            metadata: {
                submission_id: submission.id
            }
        });

        await prisma.paymentLedger.update({
            where: { id: ledger.id },
            data: { payout_status: "completed", stripe_transfer_id: transfer.id }
        })

    } catch (error) {
        console.error("Stripe Transfer Failed:", error);
        await prisma.paymentLedger.update({
            where: { id: ledger.id },
            data: { payout_status: "failed" }
        })
    }

    return ledger
}
