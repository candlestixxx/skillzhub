import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateUploadUrl } from "@/lib/services/storage"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 10 uploads per hour per creator
    const isAllowed = await rateLimit(`upload:${session.user.id}`, 10, 3600);
    if (!isAllowed) {
        return NextResponse.json({ error: "Upload rate limit exceeded. Try again later." }, { status: 429 })
    }

    const mission = await prisma.mission.findUnique({ where: { id: params.id } })
    if (!mission || mission.status !== 'OPEN') {
      return NextResponse.json({ error: "Mission not open or not found" }, { status: 400 })
    }

    const storageKey = `submissions/${params.id}/${session.user.id}/${Date.now()}.mp4`

    const signedUrl = await generateUploadUrl(storageKey);

    const submission = await prisma.submission.create({
      data: {
        mission_id: params.id,
        creator_id: session.user.id,
        raw_storage_key: storageKey,
        processing_status: 'UPLOADED'
      }
    })

    return NextResponse.json({ uploadUrl: signedUrl, submissionId: submission.id })
  } catch (error) {
    return NextResponse.json({ error: "Failed to initialize upload" }, { status: 500 })
  }
}
