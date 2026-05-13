import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateDownloadUrl } from "@/lib/services/storage"
import crypto from "crypto"

/**
 * @swagger
 * /datasets/{id}/manifest:
 *   get:
 *     summary: Retrieve a dataset manifest
 *     description: Returns the dataset manifest containing presigned video download URLs and labels. Authenticates via UI session or Programmatic API Key (Bearer token).
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Dataset ID
 *     responses:
 *       200:
 *         description: Dataset manifest JSON.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden (Does not own dataset).
 *       404:
 *         description: Dataset not found.
 */
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    let companyId: string | null = null;

    // Check for Programmatic API Key Access
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const rawKey = authHeader.split(' ')[1];

        // Hash the provided key using SHA-256 for fast O(1) lookup
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

        const apiKeyRecord = await prisma.aPIKey.findFirst({
            where: { hashed_key: hashedKey, status: 'ACTIVE' }
        });

        if (apiKeyRecord) {
            companyId = apiKeyRecord.company_id;
            // Update last used timestamp
            await prisma.aPIKey.update({ where: { id: apiKeyRecord.id }, data: { last_used_at: new Date() }});
        }
    }

    // Fallback to UI Session Auth
    if (!companyId) {
        const session = await auth()
        if (!session?.user) {
          return NextResponse.json({ error: "Unauthorized: Missing valid session or API Key" }, { status: 401 })
        }
        companyId = session.user.id;
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

    // Ensure company owns this dataset before generating manifest
    if (dataset.company_id !== companyId) {
         return NextResponse.json({ error: "Forbidden: You do not have access to this dataset" }, { status: 403 })
    }

    const samples = await Promise.all(dataset.dataset_samples.map(async (ds) => {
        let videoUrl = null;
        if (ds.submission.normalized_storage_key) {
           videoUrl = await generateDownloadUrl(ds.submission.normalized_storage_key);
        }

        return {
            sample_id: ds.id,
            submission_id: ds.submission_id,
            duration: ds.submission.duration_seconds,
            labels: ds.submission.labels_summary,
            video_url: videoUrl
        }
    }))

    const manifest = {
        dataset_id: dataset.id,
        title: dataset.title,
        license_type: dataset.license_type,
        total_duration: dataset.total_duration_seconds,
        samples
    }

    return NextResponse.json(manifest)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate manifest" }, { status: 500 })
  }
}
