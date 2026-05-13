import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import crypto from "crypto"
import { ApiKeySchema } from "@/lib/schemas"

function resolveCompanyIdFromRequest(sessionUser: { id: string; role: string }, requestedCompanyId?: string | null) {
  if (sessionUser.role === "COMPANY") {
    return sessionUser.id
  }
  if (sessionUser.role === "ADMIN" && requestedCompanyId) {
    return requestedCompanyId
  }
  return null
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = resolveCompanyIdFromRequest(
      { id: session.user.id, role: session.user.role },
      searchParams.get("company_id")
    )
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required for ADMIN users" }, { status: 400 })
    }

    const keys = await prisma.aPIKey.findMany({
      where: { company_id: companyId },
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
    if (!session?.user || (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const validated = ApiKeySchema.safeParse(body)

    if (!validated.success) {
        return NextResponse.json({ error: "Validation failed", details: validated.error.format() }, { status: 400 })
    }

    const { name, company_id } = validated.data
    const companyId = resolveCompanyIdFromRequest(
      { id: session.user.id, role: session.user.role },
      company_id ?? null
    )
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required for ADMIN users" }, { status: 400 })
    }
    // Generate a secure random string
    const secretPart = crypto.randomBytes(32).toString('hex')
    // Generate a unique ID to prefix the key
    const idPart = crypto.randomBytes(8).toString('hex')
    const rawKey = `sk_${idPart}_${secretPart}`

    // Hash using SHA-256 for fast O(1) lookups
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex')

    const key = await prisma.aPIKey.create({
      data: {
        company_id: companyId,
        name: name,
        hashed_key: hashedKey
      }
    })

    return NextResponse.json({ id: key.id, name: key.name, key: rawKey }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
  }
}
