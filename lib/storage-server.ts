import type { Task } from "@/components/context/notes-context"

// Server-side session-aware storage
class SessionTasksStore {
  private sessions: Map<string, Task[]> = new Map()
  private sessionSyncTimes: Map<string, number> = new Map()

  getTasks(sessionId: string): Task[] {
    return this.sessions.get(sessionId) || []
  }

  setTasks(sessionId: string, tasks: Task[]): void {
    this.sessions.set(sessionId, tasks)
    this.sessionSyncTimes.set(sessionId, Date.now())
  }

  addTask(sessionId: string, task: Task): void {
    const tasks = this.getTasks(sessionId)
    const existingIndex = tasks.findIndex((t) => t.id === task.id)

    if (existingIndex !== -1) {
      tasks[existingIndex] = { ...task, lastUpdated: new Date().toISOString() }
    } else {
      tasks.push({ ...task, lastUpdated: new Date().toISOString() })
    }

    this.setTasks(sessionId, tasks)
  }

  updateTask(sessionId: string, id: number, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks(sessionId)
    const index = tasks.findIndex((task) => task.id === id)
    if (index === -1) return null

    tasks[index] = {
      ...tasks[index],
      ...updates,
      id, // Ensure ID doesn't change
      lastUpdated: new Date().toISOString(),
    }

    this.setTasks(sessionId, tasks)
    return tasks[index]
  }

  deleteTask(sessionId: string, id: number): Task | null {
    const tasks = this.getTasks(sessionId)
    const index = tasks.findIndex((task) => task.id === id)
    if (index === -1) return null

    const deletedTask = tasks.splice(index, 1)[0]
    this.setTasks(sessionId, tasks)
    return deletedTask
  }

  clearAllTasks(sessionId: string): void {
    this.sessions.set(sessionId, [])
    this.sessionSyncTimes.set(sessionId, Date.now())
  }

  getLastSyncTime(sessionId: string): number {
    return this.sessionSyncTimes.get(sessionId) || Date.now()
  }

  getTaskCount(sessionId: string): number {
    return this.getTasks(sessionId).length
  }

  findTask(sessionId: string, id: number): Task | undefined {
    return this.getTasks(sessionId).find((task) => task.id === id)
  }

  // Admin/debug methods
  getSessionCount(): number {
    return this.sessions.size
  }

  getAllSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  getSessionStats(): { sessionId: string; taskCount: number; lastSync: number }[] {
    return Array.from(this.sessions.keys()).map((sessionId) => ({
      sessionId,
      taskCount: this.getTaskCount(sessionId),
      lastSync: this.getLastSyncTime(sessionId),
    }))
  }
}

// Create singleton instance
const sessionTasksStore = new SessionTasksStore()

export default sessionTasksStore
