import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const datasets = await prisma.dataset.findMany({
      where: { company_id: session.user.id },
      include: { _count: { select: { dataset_samples: true } } },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(datasets)
  } catch {
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 })
  }
}
