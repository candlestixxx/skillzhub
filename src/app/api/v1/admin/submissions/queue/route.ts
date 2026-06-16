import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const queue = await prisma.submission.findMany({
      where: { processing_status: 'IN_REVIEW' },
      include: {
          mission: { select: { title: true, constraints: true } },
          creator: { select: { name: true, email: true } }
      },
      orderBy: { updated_at: 'asc' }
    })

    return NextResponse.json(queue)
  } catch {
    return NextResponse.json({ error: "Failed to fetch review queue" }, { status: 500 })
  }
}
