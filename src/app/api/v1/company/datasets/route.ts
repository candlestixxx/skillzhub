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
      include: {
          _count: { select: { dataset_samples: true } },
          dataset_samples: {
              include: {
                  submission: {
                      select: { labels_summary: true }
                  }
              }
          }
      },
      orderBy: { created_at: 'desc' }
    })

    const enrichedDatasets = datasets.map(dataset => {
        // Check if any submission in the dataset contains synthetic data
        const hasSyntheticData = dataset.dataset_samples.some(sample => {
            const summary = sample.submission.labels_summary as Record<string, unknown> | null;
            return summary && summary.synthetic_data != null;
        });

        // Remove the heavy payload of all samples from the response, we just needed it for the flag
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { dataset_samples, ...rest } = dataset;

        return {
            ...rest,
            has_synthetic_data: hasSyntheticData
        };
    });

    return NextResponse.json(enrichedDatasets)
  } catch {
    return NextResponse.json({ error: "Failed to fetch datasets" }, { status: 500 })
  }
}
