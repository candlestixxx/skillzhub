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

    // To prevent loading massive JSON payloads into Node memory for thousands of samples,
    // we query specifically for datasets that contain synthetic data submissions.
    const syntheticSamples = await prisma.datasetSample.findMany({
        where: {
            dataset_id: { in: datasets.map(d => d.id) },
            submission: {
                labels_summary: {
                    path: ['synthetic_data'],
                    not: 'null'
                }
            }
        },
        select: { dataset_id: true }
    })

    const syntheticDatasetIds = new Set(syntheticSamples.map(s => s.dataset_id))

    const enrichedDatasets = datasets.map(dataset => ({
        ...dataset,
        has_synthetic_data: syntheticDatasetIds.has(dataset.id)
    }))

    return NextResponse.json(enrichedDatasets)
  } catch {
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 })
  }
}
