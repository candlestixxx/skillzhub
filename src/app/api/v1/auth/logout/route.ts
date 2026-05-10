import { NextResponse } from "next/server"
export async function POST() {
    return NextResponse.json({ message: "Use frontend signOut method or GET /api/auth/signout" }, { status: 200 })
}
