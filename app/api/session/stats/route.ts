import { NextResponse } from "next/server"
import sessionTasksStore from "@/lib/storage-server"

export async function GET() {
  try {
    const stats = {
      totalSessions: sessionTasksStore.getSessionCount(),
      sessions: sessionTasksStore.getSessionStats(),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("GET /api/session/stats error:", error)
    return NextResponse.json({ error: "Failed to get session stats" }, { status: 500 })
  }
}
