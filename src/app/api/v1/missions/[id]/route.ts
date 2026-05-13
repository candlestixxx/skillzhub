import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { MissionUpdateSchema } from "@/lib/schemas"

const missionResponseSelect = {
  id: true,
  company_id: true,
  title: true,
  description: true,
  task_type: true,
  environment_type: true,
  constraints: true,
  required_resolution: true,
  required_fps: true,
  min_duration_seconds: true,
  max_duration_seconds: true,
  price_per_minute: true,
  license_type: true,
  status: true,
  created_at: true,
  updated_at: true,
  webhook_url: true,
  company: { select: { name: true } },
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const mission = await prisma.mission.findUnique({
      where: { id: params.id },
      select: missionResponseSelect
    })

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 })
    }

    return NextResponse.json(mission)
  } catch (error) {
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
    const validated = MissionUpdateSchema.safeParse(data)
    if (!validated.success) {
      return NextResponse.json({ error: "Validation failed", details: validated.error.format() }, { status: 400 })
    }

    const payload = { ...validated.data }
    if (payload.webhook_secret === "") payload.webhook_secret = null
    if (payload.webhook_url === "") payload.webhook_url = null

    const updatedMission = await prisma.mission.update({
      where: { id: params.id },
      data: payload,
      select: missionResponseSelect
    })

    return NextResponse.json(updatedMission)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update mission" }, { status: 500 })
  }
}
