import { NextResponse } from "next/server"
export async function POST() {
  return NextResponse.json({ message: "Use /api/auth/callback/credentials for programmatic login or frontend signIn method" }, { status: 200 })
}
