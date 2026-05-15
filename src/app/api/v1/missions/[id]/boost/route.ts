import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * @swagger
 * /missions/{id}/boost:
 *   post:
 *     summary: Boost Mission Bounty
 *     description: Allows the owning COMPANY to surge the pricing dynamically for a specific mission by 20% to incentivize creators.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Mission ID
 *     responses:
 *       200:
 *         description: Mission bounty successfully boosted.
 *       400:
 *         description: Cannot boost a closed mission.
 *       403:
 *         description: Forbidden (Not the owning company).
 *       404:
 *         description: Mission not found.
 */
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const mission = await prisma.mission.findUnique({ where: { id: params.id } })

    if (!mission || mission.company_id !== session.user.id) {
        return NextResponse.json({ error: "Mission not found or unauthorized" }, { status: 404 })
    }

    if (mission.status !== 'OPEN') {
         return NextResponse.json({ error: "Can only boost active OPEN missions" }, { status: 400 })
    }

    // Apply a 20% surge multiplier to the price
    const newPrice = Number((mission.price_per_minute * 1.20).toFixed(2));

    const updatedMission = await prisma.mission.update({
      where: { id: params.id },
      data: {
          price_per_minute: newPrice
      }
    })

    return NextResponse.json(updatedMission)
  } catch (error) {
    return NextResponse.json({ error: "Failed to boost mission" }, { status: 500 })
  }
}
