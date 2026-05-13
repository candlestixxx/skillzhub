import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { processPayouts } from "@/lib/services/payments"
import { ReviewSchema } from "@/lib/schemas"
import { dispatchWebhook } from "@/lib/services/webhooks"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validated = ReviewSchema.safeParse(body)

    if (!validated.success) {
        return NextResponse.json({ error: "Validation failed", details: validated.error.format() }, { status: 400 })
    }

    const { status, accepted_minutes, rejection_reason } = validated.data

    const submission = await prisma.submission.findUnique({
        where: { id: params.id },
        include: { mission: true }
    })

    if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    let payout_amount = null
    if (status === 'ACCEPTED' && accepted_minutes != null) {
        payout_amount = accepted_minutes * submission.mission.price_per_minute
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: {
          processing_status: status as any,
          manual_review_status: status,
          accepted_minutes,
          payout_amount,
          rejection_reason
      }
    })

    if (status === 'ACCEPTED') {
        await processPayouts(submission.id)

        let dataset = await prisma.dataset.findFirst({
            where: { company_id: submission.mission.company_id, title: submission.mission.title + ' Dataset' }
        })

        if (!dataset) {
            dataset = await prisma.dataset.create({
                data: {
                    company_id: submission.mission.company_id,
                    title: submission.mission.title + ' Dataset',
                    description: 'Auto-generated dataset for ' + submission.mission.title,
                    source_scope: 'MISSION',
                    status: 'READY',
                    license_type: submission.mission.license_type,
                    total_duration_seconds: updatedSubmission.duration_seconds || 0
                }
            })
        } else {
             dataset = await prisma.dataset.update({
                where: { id: dataset.id },
                data: {
                    total_duration_seconds: dataset.total_duration_seconds + (updatedSubmission.duration_seconds || 0)
                }
            })
        }

        await prisma.datasetSample.create({
            data: {
                dataset_id: dataset.id,
                submission_id: submission.id
            }
        })

        // Webhook Dispatch
        if (submission.mission.webhook_url) {
            // Do not await to avoid blocking the HTTP response
            dispatchWebhook(submission.mission.webhook_url, submission.mission.webhook_secret, {
                event: "submission.accepted",
                mission_id: submission.mission.id,
                submission_id: submission.id,
                dataset_id: dataset.id,
                added_duration: updatedSubmission.duration_seconds
            })
        }
    }

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
