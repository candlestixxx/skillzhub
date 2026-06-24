import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "COMPANY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const dataset = await prisma.dataset.findUnique({
      where: { id },
    })

    if (!dataset || dataset.company_id !== session.user.id) {
      return NextResponse.json({ error: "Dataset not found or unauthorized" }, { status: 404 })
    }

    if (dataset.synthetic_data_requested) {
      return NextResponse.json({ error: "Synthetic data already requested for this dataset." }, { status: 400 })
    }

    const updatedDataset = await prisma.dataset.update({
      where: { id },
      data: {
        synthetic_data_requested: true,
      },
    })

    return NextResponse.json(updatedDataset, { status: 200 })

  } catch (error) {
    console.error("Error requesting synthetic data:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
