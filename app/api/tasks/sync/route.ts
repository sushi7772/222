import { type NextRequest, NextResponse } from "next/server"
import sessionTasksStore from "@/lib/storage-server"

function getSessionId(request: NextRequest): string {
  const sessionId = request.headers.get("x-session-id")
  if (!sessionId) {
    throw new Error("Session ID is required")
  }
  return sessionId
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = getSessionId(request)
    const { tasks: clientTasks } = await request.json()

    if (!Array.isArray(clientTasks)) {
      return NextResponse.json({ error: "Invalid tasks data" }, { status: 400 })
    }

    // Simple sync strategy: replace all tasks for this session
    const tasksWithTimestamp = clientTasks.map((task) => ({
      ...task,
      lastUpdated: new Date().toISOString(),
    }))

    sessionTasksStore.setTasks(sessionId, tasksWithTimestamp)

    return NextResponse.json({
      success: true,
      syncedCount: sessionTasksStore.getTaskCount(sessionId),
      message: "Tasks synced successfully",
    })
  } catch (error) {
    console.error("POST /api/tasks/sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
