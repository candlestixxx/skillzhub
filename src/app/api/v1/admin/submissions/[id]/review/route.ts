import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ReviewSchema } from "@/lib/schemas"
import { acceptSubmissionAndTriggerDownstream } from "@/lib/services/submissions"

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

    if (status === 'ACCEPTED') {
        const minToAccept = accepted_minutes ?? ((submission.duration_seconds || 0) / 60);
        // Delegate to the shared acceptance handler to prevent logic duplication
        const updated = await acceptSubmissionAndTriggerDownstream(submission.id, minToAccept, submission.duration_seconds || 0);

        // If there was a manual reason provided, we can still record it (even though it's an acceptance)
        if (rejection_reason) {
            await prisma.submission.update({
                where: { id: submission.id },
                data: { manual_review_status: status, rejection_reason }
            });
        }

        return NextResponse.json(updated);
    } else {
        // Handle rejection or other states
        const updatedSubmission = await prisma.submission.update({
          where: { id: params.id },
          data: {
              processing_status: status as any,
              manual_review_status: status,
              rejection_reason
          }
        })
        return NextResponse.json(updatedSubmission)
    }

  } catch (error) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
  }
}
