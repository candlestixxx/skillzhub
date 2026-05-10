import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let whereClause = {}
    if (status) {
      whereClause = { status }
    }

    const missions = await prisma.mission.findMany({
      where: whereClause,
      include: { company: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(missions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const mission = await prisma.mission.create({
      data: {
        ...data,
        company_id: session.user.id
      }
    })

    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create mission" }, { status: 500 })
  }
}
