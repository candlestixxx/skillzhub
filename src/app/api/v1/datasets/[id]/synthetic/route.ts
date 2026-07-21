import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syntheticQueue } from "@/lib/services/queue";

/**
 * @swagger
 * /datasets/{id}/synthetic:
 *   post:
 *     summary: Request synthetic data generation
 *     description: Triggers a background job to generate synthetic data (e.g., depth maps) for an entire dataset.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The dataset ID
 *     responses:
 *       202:
 *         description: Job accepted and queued
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Internal server error
 */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const dataset = await prisma.dataset.findUnique({
            where: { id }
        });

        if (!dataset) {
            return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
        }

        // Add job to the synthetic queue
        await syntheticQueue.add('generate-synthetic', {
            datasetId: dataset.id
        });

        return NextResponse.json({ message: "Synthetic data generation queued successfully" }, { status: 202 });

    } catch (error) {
        console.error("Error queueing synthetic data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
