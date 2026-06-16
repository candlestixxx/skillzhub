import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import crypto from "crypto"
import { ApiKeySchema } from "@/lib/schemas"

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
  } catch {
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validated = ApiKeySchema.safeParse(body)

    if (!validated.success) {
        return NextResponse.json({ error: "Validation failed", details: validated.error.format() }, { status: 400 })
    }

    const { name } = validated.data
    // Generate a secure random string
    const secretPart = crypto.randomBytes(32).toString('hex')
    // Generate a unique ID to prefix the key
    const idPart = crypto.randomBytes(8).toString('hex')
    const rawKey = `sk_${idPart}_${secretPart}`

    // Hash using SHA-256 for fast O(1) lookups
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

    const key = await prisma.aPIKey.create({
      data: {
        company_id: session.user.id,
        name: name,
        hashed_key: hashedKey
      }
    })

    return NextResponse.json({ id: key.id, name: key.name, key: rawKey }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
