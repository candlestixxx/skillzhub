import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: params.id },
      include: { company: { select: { name: true } } }
    })

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 })
    }

    return NextResponse.json(mission)
  } catch {
    return NextResponse.json({ error: "Failed to fetch mission" }, { status: 500 })
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const mission = await prisma.mission.findUnique({ where: { id: params.id } })
    if (!mission || mission.company_id !== session.user.id) {
        return NextResponse.json({ error: "Mission not found or unauthorized" }, { status: 404 })
    }

    if (mission.status !== 'OPEN' && mission.status !== 'DRAFT') {
         return NextResponse.json({ error: "Cannot edit closed mission" }, { status: 400 })
    }

    const data = await req.json()
    const updatedMission = await prisma.mission.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(updatedMission)
  } catch {
    return NextResponse.json({ error: "Failed to update mission" }, { status: 500 })
  }
}
