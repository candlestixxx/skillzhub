import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateDownloadUrl } from "@/lib/services/storage"

/**
 * @swagger
 * /admin/submissions/{id}/video:
 *   get:
 *     summary: Get presigned video URL for Admin review
 *     description: Returns a temporary presigned URL for the raw video file associated with a submission. Only accessible to ADMIN users.
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
 *         description: Forbidden (Not an admin).
 *       404:
 *         description: Submission not found or no storage key.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id }
    })

    if (!submission || !submission.raw_storage_key) {
      return NextResponse.json({ error: "Submission or video not found" }, { status: 404 })
    }

    const videoUrl = await generateDownloadUrl(submission.raw_storage_key);

    return NextResponse.json({ url: videoUrl })
  } catch {
    return NextResponse.json({ error: "Failed to generate video url" }, { status: 500 })
  }
}
