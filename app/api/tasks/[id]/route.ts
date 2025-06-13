import { type NextRequest, NextResponse } from "next/server"
import sessionTasksStore from "@/lib/storage-server"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getSessionId(request: NextRequest): string {
  const sessionId = request.headers.get("x-session-id")
  if (!sessionId) {
    throw new Error("Session ID is required")
  }
  return sessionId
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await delay(50)

    const sessionId = getSessionId(request)
    const id = Number.parseInt(params.id)
    const updates = await request.json()

    const updatedTask = sessionTasksStore.updateTask(sessionId, id, updates)

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(updatedTask, {
      headers: {
        "Last-Modified": new Date(sessionTasksStore.getLastSyncTime(sessionId)).toUTCString(),
      },
    })
  } catch (error) {
    console.error(`PUT /api/tasks/${params.id} error:`, error)
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await delay(50)

    const sessionId = getSessionId(request)
    const id = Number.parseInt(params.id)

    console.log(`Attempting to delete task ${id} for session ${sessionId}`)
    console.log(`Current tasks in session: ${sessionTasksStore.getTaskCount(sessionId)}`)
    console.log(
      `Available task IDs: ${sessionTasksStore
        .getTasks(sessionId)
        .map((t) => t.id)
        .join(", ")}`,
    )

    const deletedTask = sessionTasksStore.deleteTask(sessionId, id)

    if (!deletedTask) {
      console.log(`Task with ID ${id} not found in session ${sessionId}`)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    console.log(`Successfully deleted task ${id}. Remaining tasks: ${sessionTasksStore.getTaskCount(sessionId)}`)

    return NextResponse.json({
      success: true,
      deletedTask,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error(`DELETE /api/tasks/${params.id} error:`, error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
