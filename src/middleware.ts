import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default auth(async (req) => {
  const { nextUrl } = req

  // Edge offloading: Pre-compute API key hashes securely at the Edge via WebCrypto API
  // to save CPU cycles and latency on the Node.js backend.
  const authHeader = req.headers.get("Authorization")
  const requestHeaders = new Headers(req.headers)

  if (authHeader && authHeader.startsWith("Bearer sk_")) {
    const rawKey = authHeader.replace("Bearer ", "")
    const hashedKey = await hashKey(rawKey)
    requestHeaders.set("x-api-key-hash", hashedKey)
  }

  if (nextUrl.pathname.startsWith('/api/v1/admin') && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (nextUrl.pathname.startsWith('/api/v1/company') && req.auth?.user?.role !== 'COMPANY' && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (nextUrl.pathname.startsWith('/api/v1/creator') && req.auth?.user?.role !== 'CREATOR' && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
