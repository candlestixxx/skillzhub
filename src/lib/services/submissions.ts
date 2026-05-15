import { prisma } from "@/lib/prisma"
import { processPayouts } from "@/lib/services/payments"
import { dispatchWebhook } from "@/lib/services/webhooks"

/**
 * Handles the cascading actions required when a submission is marked as ACCEPTED.
 * This can be triggered manually by an Admin, or automatically by the worker if the Creator has a high Trust Tier.
 */
export async function acceptSubmissionAndTriggerDownstream(submissionId: string, acceptedMinutes: number, durationSeconds: number) {
    const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { mission: true }
    });

    if (!submission) throw new Error("Submission not found");

    const payout_amount = acceptedMinutes * submission.mission.price_per_minute;

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
          processing_status: 'ACCEPTED',
          accepted_minutes: acceptedMinutes,
          payout_amount
      }
    });

    // 1. Process Payouts
    await processPayouts(submission.id);

    // 2. Idempotent Dataset Generation
    let dataset = await prisma.dataset.findFirst({
        where: { company_id: submission.mission.company_id, title: submission.mission.title + ' Dataset' }
    });

    if (!dataset) {
        dataset = await prisma.dataset.create({
            data: {
                company_id: submission.mission.company_id,
                title: submission.mission.title + ' Dataset',
                description: 'Auto-generated dataset for ' + submission.mission.title,
                source_scope: 'MISSION',
                status: 'READY',
                license_type: submission.mission.license_type,
                total_duration_seconds: durationSeconds || 0
            }
        });
    } else {
         dataset = await prisma.dataset.update({
            where: { id: dataset.id },
            data: {
                total_duration_seconds: dataset.total_duration_seconds + (durationSeconds || 0)
            }
        });
    }

    // Link sample to dataset
    await prisma.datasetSample.create({
        data: {
            dataset_id: dataset.id,
            submission_id: submission.id
        }
    });

    // 3. Webhook Dispatch
    if (submission.mission.webhook_url) {
        // Do not await to avoid blocking the thread
        dispatchWebhook(submission.mission.webhook_url, submission.mission.webhook_secret, {
            event: "submission.accepted",
            mission_id: submission.mission.id,
            submission_id: submission.id,
            dataset_id: dataset.id,
            added_duration: durationSeconds
        });
    }

    return updatedSubmission;
}
