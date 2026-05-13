import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { MissionSchema } from "@/lib/schemas"

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

/**
 * @swagger
 * /missions:
 *   get:
 *     summary: Retrieve a list of missions
 *     description: Returns a list of missions. Companies only see their own. Creators see open missions.
 *     responses:
 *       200:
 *         description: A list of missions.
 *       500:
 *         description: Internal Server Error
 */
export async function GET(req: Request) {
  try {
    const session = await auth()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const whereClause: Prisma.MissionWhereInput = {}

    if (status) {
      whereClause.status = status;
    }

    if (session?.user?.role === 'COMPANY') {
        whereClause.company_id = session.user.id;
    }

    const missions = await prisma.mission.findMany({
      where: whereClause,
      select: missionResponseSelect,
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json(missions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch missions" }, { status: 500 })
  }
}

/**
 * @swagger
 * /missions:
 *   post:
 *     summary: Create a new mission
 *     description: Allows a COMPANY user to create a new mission for creators to fulfill.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mission created successfully.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Forbidden (Not a company).
 */
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

    const payload = { ...validated.data }
    if (payload.webhook_secret === "") payload.webhook_secret = null
    if (payload.webhook_url === "") payload.webhook_url = null

    const mission = await prisma.mission.create({
      data: {
        ...payload,
        company_id: session.user.id
      },
      select: missionResponseSelect
    })

    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create mission" }, { status: 500 })
  }
}
