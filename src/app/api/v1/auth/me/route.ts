export const runtime = 'edge';

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Since we are running on the Edge runtime, we avoid full Prisma client initializations
    // and rely strictly on the session payload for fast user metadata retrieval.
    return NextResponse.json(session.user)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
