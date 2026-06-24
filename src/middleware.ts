import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Memory cache for Edge rate-limiting (approximate per-isolate)
const edgeRateLimitCache = new Map<string, { count: number, resetAt: number }>();

function structuralEdgeRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100; // Max requests per minute per IP

  const record = edgeRateLimitCache.get(ip);
  if (!record || now > record.resetAt) {
    edgeRateLimitCache.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  record.count++;
  if (record.count > maxRequests) {
    return false; // Rate limit exceeded at Edge
  }

  return true;
}

export default auth((req) => {
  const { nextUrl } = req
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // 1. Edge Rate Limiting: Block hyper-aggressive bots immediately before DB hits
  if (nextUrl.pathname.startsWith('/api/v1')) {
     if (!structuralEdgeRateLimit(ip)) {
         return NextResponse.json({ error: "Too Many Requests (Edge Blocked)" }, { status: 429 })
     }
  }

  // 2. Edge API Validation: structurally fail malformed API Keys immediately
  if (nextUrl.pathname.startsWith('/api/v1/missions') || nextUrl.pathname.startsWith('/api/v1/datasets')) {
      const authHeader = req.headers.get('authorization');

      // If it's a Bearer token (API Key path), perform structural validation
      if (authHeader && authHeader.startsWith('Bearer ')) {
          const key = authHeader.split(' ')[1];
          // Valid SkillzHub keys are currently UUIDs (36 chars) or a specific hash length.
          // If a bot sends a massive SQL injection string or tiny string, drop it at the edge.
          if (key.length < 20 || key.length > 200) {
              return NextResponse.json({ error: "Invalid API Key Format" }, { status: 400 })
          }
      }
  }

  // 3. RBAC Session Enforcement
  if (nextUrl.pathname.startsWith('/api/v1/admin') && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (nextUrl.pathname.startsWith('/api/v1/company') && req.auth?.user?.role !== 'COMPANY' && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (nextUrl.pathname.startsWith('/api/v1/creator') && req.auth?.user?.role !== 'CREATOR' && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.next()
})
