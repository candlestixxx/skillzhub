import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
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

    const updatedMission = await prisma.mission.update({
      where: { id: params.id },
      data: { status: 'CLOSED' }
    })

    return NextResponse.json(updatedMission)
  } catch {
    return NextResponse.json({ error: "Failed to close mission" }, { status: 500 })
  }
}
