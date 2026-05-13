import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { mission: true, creator: { select: { name: true } } }
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    if (session.user.role === 'CREATOR' && submission.creator_id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (session.user.role === 'COMPANY' && submission.mission.company_id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 })
  }
}
