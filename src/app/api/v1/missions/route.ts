import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { MissionSchema } from "@/lib/schemas"

export async function GET(req: Request) {
  try {
    const session = await auth()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (status) {
      whereClause.status = status;
    }

    if (session?.user?.role === 'COMPANY') {
        whereClause.company_id = session.user.id;
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

    const body = await req.json()
    const validated = MissionSchema.safeParse(body)

    if (!validated.success) {
        return NextResponse.json({ error: "Validation failed", details: validated.error.format() }, { status: 400 })
    }

    const mission = await prisma.mission.create({
      data: {
        ...validated.data,
        company_id: session.user.id
      }
    })

    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create mission" }, { status: 500 })
  }
}
