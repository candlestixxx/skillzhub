import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const key = await prisma.aPIKey.findUnique({
      where: { id: params.id }
    })

    if (!key) {
        return NextResponse.json({ error: "API Key not found or unauthorized" }, { status: 404 })
    }

    if (session.user.role === 'COMPANY' && key.company_id !== session.user.id) {
        return NextResponse.json({ error: "API Key not found or unauthorized" }, { status: 404 })
    }

    await prisma.aPIKey.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Key revoked successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 })
  }
}
