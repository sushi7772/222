import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (replace with database in production)
const tasks: any[] = []

export async function PUT(request: NextRequest) {
  try {
    const { updates } = await request.json()

    for (const update of updates) {
      const index = tasks.findIndex((task) => task.id === update.id)
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...update.data }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Batch update failed" }, { status: 500 })
  }
}
