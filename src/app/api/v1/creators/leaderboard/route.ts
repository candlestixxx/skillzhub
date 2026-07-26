import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @swagger
 * /creators/leaderboard:
 *   get:
 *     summary: Retrieve creator leaderboard
 *     description: Returns a list of top creators ranked by reputation score and total payouts.
 *     responses:
 *       200:
 *         description: Leaderboard data.
 *       500:
 *         description: Internal Server Error
 */
export async function GET() {
  try {
    const topCreators = await prisma.user.findMany({
      where: { role: 'CREATOR' },
      orderBy: [
          { reputation_score: 'desc' },
          { created_at: 'asc' }
      ],
      take: 10,
      select: {
          id: true,
          name: true,
          reputation_score: true,
          trust_tier: true,
      }
    });

    // Also get total payouts for these creators to add to the leaderboard
    const creatorsWithPayouts = await Promise.all(topCreators.map(async (creator) => {
        const ledgers = await prisma.paymentLedger.aggregate({
            where: { creator_id: creator.id },
            _sum: { net_payout_amount: true }
        });

        return {
            ...creator,
            total_earnings: ledgers._sum.net_payout_amount || 0
        };
    }));

    return NextResponse.json(creatorsWithPayouts)
  } catch {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
