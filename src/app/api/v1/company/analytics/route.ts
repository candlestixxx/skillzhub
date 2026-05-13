import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * @swagger
 * /company/analytics:
 *   get:
 *     summary: Retrieve company analytics
 *     description: Returns aggregated metrics for the company's missions and submissions.
 *     responses:
 *       200:
 *         description: Analytics payload containing dataset durations and submission status counts.
 *       403:
 *         description: Forbidden (Not a company).
 *       500:
 *         description: Internal Server Error
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const companyId = session.user.id;

    // Fetch dataset durations
    const datasets = await prisma.dataset.findMany({
        where: { company_id: companyId },
        select: { title: true, total_duration_seconds: true }
    });

    const datasetDurations = datasets.map(d => ({
        name: d.title.substring(0, 15) + (d.title.length > 15 ? '...' : ''),
        duration: d.total_duration_seconds
    }));

    // Aggregate submission statuses across all company missions
    const submissions = await prisma.submission.groupBy({
        by: ['processing_status'],
        where: {
            mission: {
                company_id: companyId
            }
        },
        _count: {
            id: true
        }
    });

    const statusCounts = submissions.map(s => ({
        name: s.processing_status.replace(/_/g, ' '),
        value: s._count.id
    }));

    // Aggregate total spend
    const ledgers = await prisma.paymentLedger.aggregate({
        where: {
            mission: {
                company_id: companyId
            }
        },
        _sum: {
            gross_amount: true
        }
    });

    const totalSpend = ledgers._sum.gross_amount || 0;

    return NextResponse.json({
        datasetDurations,
        statusCounts,
        totalSpend
    })

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
