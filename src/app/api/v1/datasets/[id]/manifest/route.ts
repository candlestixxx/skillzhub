import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
      include: {
          dataset_samples: {
              include: { submission: true }
          }
      }
    })

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }

    if (session.user.role === 'COMPANY' && dataset.company_id !== session.user.id) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const manifest = {
        dataset_id: dataset.id,
        title: dataset.title,
        license_type: dataset.license_type,
        total_duration: dataset.total_duration_seconds,
        samples: dataset.dataset_samples.map(ds => ({
            sample_id: ds.id,
            submission_id: ds.submission_id,
            duration: ds.submission.duration_seconds,
            labels: ds.submission.labels_summary,
            video_url: `https://mock-storage.com/download/${ds.submission.normalized_storage_key}`
        }))
    }

    return NextResponse.json(manifest)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate manifest" }, { status: 500 })
  }
}
