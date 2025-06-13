import type { Task } from "@/components/context/notes-context"

declare global {
  var tasksStore: Task[]
  var lastSyncTime: number
}
