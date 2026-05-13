import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getProcessingQueue } from "@/lib/services/queue"
import { objectExists } from "@/lib/services/storage"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { submissionId } = await req.json()

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } })
    if (!submission || submission.creator_id !== session.user.id || submission.mission_id !== params.id) {
       return NextResponse.json({ error: "Invalid submission" }, { status: 400 })
    }
    if (!submission.raw_storage_key) {
      return NextResponse.json({ error: "Submission has no storage key" }, { status: 400 })
    }

    const exists = await objectExists(submission.raw_storage_key)
    if (!exists) {
      return NextResponse.json({ error: "Upload not found in storage" }, { status: 400 })
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { processing_status: 'PROCESSING' }
    })

    await getProcessingQueue().add('process-video', {
        submissionId: submission.id,
        rawStorageKey: submission.raw_storage_key
    })

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 })
  }
}
