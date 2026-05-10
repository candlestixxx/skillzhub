import { prisma } from './prisma'

export async function processPayouts(submissionId: string) {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { mission: true, creator: true }
    })

    if (!submission || submission.processing_status !== 'ACCEPTED' || !submission.accepted_minutes) {
        throw new Error("Invalid submission for payout")
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

    console.log(`Mock Stripe Transfer: $${net} to ${submission.creator.payout_account_id}`)

    await prisma.paymentLedger.update({
        where: { id: ledger.id },
        data: { payout_status: "completed", stripe_transfer_id: "tr_mock123" }
    })

    return ledger
}
