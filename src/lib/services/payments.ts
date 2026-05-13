import { Prisma } from "@prisma/client"
import { prisma } from '../prisma'
import { getStripe } from "./stripe"

export async function processPayouts(submissionId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? prisma
    const submission = await db.submission.findUnique({
        where: { id: submissionId },
        include: { mission: true, creator: true }
    })

    if (!submission || submission.processing_status !== 'ACCEPTED' || submission.accepted_minutes == null || submission.accepted_minutes < 0) {
        throw new Error("Invalid submission for payout")
    }

    if (!submission.creator.payout_account_id) {
         throw new Error("Creator does not have a connected payout account")
    }

    const rate = submission.mission.price_per_minute
    const gross = submission.accepted_minutes * rate
    const platformFee = gross * 0.20 // 20% fee
    const net = gross - platformFee

    const roundedAcceptedMinutes = Number(submission.accepted_minutes.toFixed(4))

    const ledger = await db.paymentLedger.create({
        data: {
            submission_id: submission.id,
            creator_id: submission.creator_id,
            mission_id: submission.mission_id,
            accepted_minutes: roundedAcceptedMinutes,
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

        await db.paymentLedger.update({
            where: { id: ledger.id },
            data: { payout_status: "completed", stripe_transfer_id: transfer.id }
        })

    } catch (error) {
        console.error("Stripe Transfer Failed:", error);
        await db.paymentLedger.update({
            where: { id: ledger.id },
            data: { payout_status: "failed" }
        })
    }

    return ledger
}
