"use client"

import type { Task } from "@/components/context/notes-context"
import { getSessionId } from "@/lib/session"

const API_BASE = "/api"

class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 2 * 60 * 1000 // 2 minutes
  private requestQueue = new Map<string, Promise<any>>()

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "x-session-id": getSessionId(),
    }
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const sessionId = getSessionId()
    const requestKey = `${url}-${sessionId}-${JSON.stringify(options)}`

    // Return existing request if in progress
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const requestPromise = (async () => {
      try {
        console.log(`Making API request: ${options?.method || "GET"} ${url} [Session: ${sessionId}]`)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...this.getHeaders(),
            ...options?.headers,
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API Error: ${response.status} ${response.statusText}`, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
        }

        const data = await response.json()
        console.log(`API Success: ${options?.method || "GET"} ${url} [Session: ${sessionId}]`, data)
        this.requestQueue.delete(requestKey)
        return data
      } catch (error) {
        clearTimeout(timeoutId)
        this.requestQueue.delete(requestKey)
        console.error(`API Request Failed: ${options?.method || "GET"} ${url} [Session: ${sessionId}]`, error)
        throw error
      }
    })()

    this.requestQueue.set(requestKey, requestPromise)
    return requestPromise
  }

  private getCached<T>(key: string): T | null {
    const sessionId = getSessionId()
    const cacheKey = `${key}-${sessionId}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    this.cache.delete(cacheKey) // Remove expired cache
    return null
  }

  private setCache(key: string, data: any): void {
    const sessionId = getSessionId()
    const cacheKey = `${key}-${sessionId}`
    this.cache.set(cacheKey, { data, timestamp: Date.now() })
  }

  private invalidateCache(pattern?: string): void {
    const sessionId = getSessionId()
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern) && key.includes(sessionId)) {
          this.cache.delete(key)
        }
      }
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(sessionId)) {
          this.cache.delete(key)
        }
      }
    }
  }

  async fetchTasks(): Promise<Task[]> {
    const cacheKey = "tasks"
    const cached = this.getCached<Task[]>(cacheKey)
    if (cached) return cached

    try {
      const tasks = await this.request<Task[]>(`${API_BASE}/tasks`)
      this.setCache(cacheKey, tasks)
      return tasks
    } catch (error) {
      console.error("API Error (fetchTasks):", error)
      return []
    }
  }

  async createTask(task: Task): Promise<Task> {
    try {
      const result = await this.request<Task>(`${API_BASE}/tasks`, {
        method: "POST",
        body: JSON.stringify(task),
      })
      this.invalidateCache("tasks")
      return result
    } catch (error) {
      console.error("API Error (createTask):", error)
      throw error
    }
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    try {
      const result = await this.request<Task>(`${API_BASE}/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      })
      this.invalidateCache("tasks")
      return result
    } catch (error) {
      console.error("API Error (updateTask):", error)
      // Don't throw error for updates, just log it
      return updates as Task
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      console.log(`Client: Attempting to delete task ${id}`)
      const result = await this.request<{ success: boolean; deletedTask: Task; message: string }>(
        `${API_BASE}/tasks/${id}`,
        {
          method: "DELETE",
        },
      )
      console.log(`Client: Delete successful`, result)
      this.invalidateCache("tasks")
    } catch (error) {
      console.error("API Error (deleteTask):", error)
      // Re-throw delete errors so the UI can handle them properly
      throw error
    }
  }

  async clearAllTasks(): Promise<void> {
    try {
      console.log(`Client: Attempting to clear all tasks`)
      const result = await this.request<{ success: boolean; message: string }>(`${API_BASE}/tasks`, {
        method: "DELETE",
      })
      console.log(`Client: Clear all successful`, result)
      this.invalidateCache("tasks")
    } catch (error) {
      console.error("API Error (clearAllTasks):", error)
      throw error
    }
  }

  async syncTasks(tasks: Task[]): Promise<void> {
    try {
      await this.request<void>(`${API_BASE}/tasks/sync`, {
        method: "POST",
        body: JSON.stringify({ tasks }),
      })
      this.invalidateCache("tasks")
    } catch (error) {
      console.error("API Error (syncTasks):", error)
      throw error
    }
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      await this.request<{ status: string }>(`${API_BASE}/health`)
      return true
    } catch (error) {
      return false
    }
  }

  // Session stats (for debugging)
  async getSessionStats(): Promise<any> {
    try {
      return await this.request<any>(`${API_BASE}/session/stats`)
    } catch (error) {
      console.error("API Error (getSessionStats):", error)
      return null
    }
  }
}

export const apiClient = new ApiClient()

// Legacy exports for backward compatibility
export const fetchTasks = () => apiClient.fetchTasks()
export const createTask = (task: Task) => apiClient.createTask(task)
export const updateTask = (id: number, updates: Partial<Task>) => apiClient.updateTask(id, updates)
export const deleteTask = (id: number) => apiClient.deleteTask(id)
export const clearAllTasks = () => apiClient.clearAllTasks()
