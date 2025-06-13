import { type NextRequest, NextResponse } from "next/server"
import type { Task } from "@/components/context/notes-context"
import sessionTasksStore from "@/lib/storage-server"

// Simulate database operations with delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getSessionId(request: NextRequest): string {
  const sessionId = request.headers.get("x-session-id") || request.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    throw new Error("Session ID is required")
  }
  return sessionId
}

export async function GET(request: NextRequest) {
  try {
    await delay(100)

    const sessionId = getSessionId(request)
    const tasks = sessionTasksStore.getTasks(sessionId)

    return NextResponse.json(tasks, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Last-Modified": new Date(sessionTasksStore.getLastSyncTime(sessionId)).toUTCString(),
      },
    })
  } catch (error) {
    console.error("GET /api/tasks error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await delay(50)

    const sessionId = getSessionId(request)
    const task = (await request.json()) as Task

    // Validate required fields
    if (!task.id || !task.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    sessionTasksStore.addTask(sessionId, task)

    return NextResponse.json(task, {
      status: 201,
      headers: {
        "Last-Modified": new Date(sessionTasksStore.getLastSyncTime(sessionId)).toUTCString(),
      },
    })
  } catch (error) {
    console.error("POST /api/tasks error:", error)
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await delay(50)

    const sessionId = getSessionId(request)

    console.log(`Clearing all tasks for session: ${sessionId}`)
    sessionTasksStore.clearAllTasks(sessionId)

    console.log(`Successfully cleared all tasks for session: ${sessionId}`)

    return NextResponse.json({
      success: true,
      message: "All tasks cleared successfully",
    })
  } catch (error) {
    console.error("DELETE /api/tasks error:", error)
    return NextResponse.json({ error: "Failed to clear tasks" }, { status: 500 })
  }
}
