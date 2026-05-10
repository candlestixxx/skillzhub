import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { processPayouts } from "@/lib/payments"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { status, accepted_minutes, rejection_reason } = await req.json()

    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

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
             await prisma.dataset.update({
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
    }

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
