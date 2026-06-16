import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submissions = await prisma.submission.findMany({
      where: { creator_id: session.user.id },
      include: { mission: { select: { title: true, price_per_minute: true } } },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(submissions)
  } catch {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
