import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const keys = await prisma.aPIKey.findMany({
      where: { company_id: session.user.id },
      select: { id: true, name: true, status: true, last_used_at: true, created_at: true }
    })

    return NextResponse.json(keys)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { name } = await req.json()
    const rawKey = `sk_test_${crypto.randomBytes(24).toString('hex')}`
    const hashedKey = await bcrypt.hash(rawKey, 10)

    const key = await prisma.aPIKey.create({
      data: {
        company_id: session.user.id,
        name: name || 'Default Key',
        hashed_key: hashedKey
      }
    })

    return NextResponse.json({ id: key.id, name: key.name, key: rawKey }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
