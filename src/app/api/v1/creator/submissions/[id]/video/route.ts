import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateDownloadUrl } from "@/lib/services/storage"

/**
 * @swagger
 * /creator/submissions/{id}/video:
 *   get:
 *     summary: Get presigned video URL for Creator playback
 *     description: Returns a temporary presigned URL for the raw video file associated with a submission. Only accessible to the CREATOR who uploaded it.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Submission ID
 *     responses:
 *       200:
 *         description: Successfully retrieved presigned URL.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Not the owning creator).
 *       404:
 *         description: Submission not found or no storage key.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id }
    })

    if (!submission || !submission.raw_storage_key) {
      return NextResponse.json({ error: "Submission or video not found" }, { status: 404 })
    }

    // Ensure only the creator who uploaded the video can fetch the download URL
    if (submission.creator_id !== session.user.id) {
       return NextResponse.json({ error: "Forbidden: You do not own this submission" }, { status: 403 })
    }

    const videoUrl = await generateDownloadUrl(submission.raw_storage_key);

    return NextResponse.json({ url: videoUrl })
  } catch {
    return NextResponse.json({ error: "Failed to generate video url" }, { status: 500 })
  }
}
