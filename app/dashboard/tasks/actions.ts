"use server"

import { db } from "@/lib/db"
import { tasks } from "@/lib/db/schema"
import { alerts } from "@/lib/db/schema"
import { and, desc, eq, lte, ne, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

const REMINDER_INTERVALS = [6, 12, 24]
const REPEAT_FREQUENCIES = ["once", "daily", "weekly", "monthly", "semiannual", "quarterly", "yearly"]

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value)
}

function getNextReminderAt(dueDate: string | Date, offsetDays: number) {
  const nextReminderAt = toDate(dueDate)
  nextReminderAt.setDate(nextReminderAt.getDate() - offsetDays)
  return nextReminderAt
}

function getNextOccurrence(currentDueDate: Date, repeatFrequency: string) {
  const next = new Date(currentDueDate)

  switch (repeatFrequency) {
    case "daily":
      next.setDate(next.getDate() + 1)
      break
    case "weekly":
      next.setDate(next.getDate() + 7)
      break
    case "monthly":
      next.setMonth(next.getMonth() + 1)
      break
    case "quarterly":
      next.setMonth(next.getMonth() + 3)
      break
    case "semiannual":
      next.setMonth(next.getMonth() + 6)
      break
    case "yearly":
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      return currentDueDate
  }

  return next
}

export async function getTasks() {
  await requireUserId()
  return await db.select().from(tasks).orderBy(tasks.dueDate)
}

export async function getTaskReminders() {
  await requireUserId()
  const now = new Date()
  await syncTaskRemindersToAlerts()
  return await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      repeatFrequency: tasks.repeatFrequency,
      reminderOffsetDays: tasks.reminderOffsetDays,
      reminderIntervalHours: tasks.reminderIntervalHours,
      status: tasks.status,
      nextReminderAt: tasks.nextReminderAt,
    })
    .from(tasks)
    .where(and(ne(tasks.status, "done"), ne(tasks.status, "in_progress"), lte(tasks.nextReminderAt, now)))
    .orderBy(tasks.nextReminderAt)
}

export async function syncTaskRemindersToAlerts() {
  await requireUserId()
  const now = new Date()
  const dueTasks = await db
    .select()
    .from(tasks)
    .where(and(ne(tasks.status, "done"), lte(tasks.nextReminderAt, now)))

  for (const task of dueTasks) {
    // skip if an alert already exists for this task and is unread
    const existing = await db.select().from(alerts).where(eq(alerts.relatedTaskId, task.id)).limit(1)
    if (existing.length > 0) continue

    await db.insert(alerts).values({
      title: `تذكير: ${task.title}`,
      message: `موعد المهمة: ${new Date(task.dueDate).toLocaleString("ar-EG")}`,
      level: "medium",
      category: "task",
      isRead: false,
      relatedTaskId: task.id,
    }).catch(() => null)
  }

  revalidatePath("/dashboard/alerts")
}

export async function createTask(data: {
  title: string
  description?: string | null
  dueDate: string
  repeatFrequency: string
  reminderOffsetDays: number
  reminderIntervalHours: number
  status: string
}) {
  const userId = await requireUserId()
  const nextReminderAt = getNextReminderAt(data.dueDate, data.reminderOffsetDays)

  const [newTask] = await db.insert(tasks).values({
    title: data.title,
    description: data.description || null,
    dueDate: new Date(data.dueDate),
    repeatFrequency: REPEAT_FREQUENCIES.includes(data.repeatFrequency) ? data.repeatFrequency : "once",
    reminderOffsetDays: data.reminderOffsetDays,
    reminderIntervalHours: REMINDER_INTERVALS.includes(data.reminderIntervalHours) ? data.reminderIntervalHours : 24,
    nextReminderAt,
    status: data.status,
    isRead: false,
    userId,
  }).returning()

  revalidatePath("/dashboard/tasks")
  return newTask
}

export async function updateTask(id: number, data: {
  title: string
  description?: string | null
  dueDate: string
  repeatFrequency: string
  reminderOffsetDays: number
  reminderIntervalHours: number
  status: string
}) {
  await requireUserId()
  const existingTask = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!existingTask.length) throw new Error("Task not found")

  const nextReminderAt = getNextReminderAt(data.dueDate, data.reminderOffsetDays)

  const [updated] = await db
    .update(tasks)
    .set({
      title: data.title,
      description: data.description || null,
      dueDate: new Date(data.dueDate),
      repeatFrequency: REPEAT_FREQUENCIES.includes(data.repeatFrequency) ? data.repeatFrequency : "once",
      reminderOffsetDays: data.reminderOffsetDays,
      reminderIntervalHours: REMINDER_INTERVALS.includes(data.reminderIntervalHours) ? data.reminderIntervalHours : 24,
      nextReminderAt,
      status: data.status,
    })
    .where(eq(tasks.id, id))
    .returning()

  revalidatePath("/dashboard/tasks")
  return updated
}

export async function deleteTask(id: number) {
  await requireUserId()
  await db.delete(tasks).where(eq(tasks.id, id))
  revalidatePath("/dashboard/tasks")
  return { success: true }
}

export async function acknowledgeTaskReminder(id: number) {
  await requireUserId()
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) throw new Error("Task not found")

  const nextReminderAt = new Date(Date.now() + task.reminderIntervalHours * 60 * 60 * 1000)

  await db
    .update(tasks)
    .set({
      nextReminderAt,
      isRead: true,
    })
    .where(eq(tasks.id, id))

  revalidatePath("/dashboard/tasks")
  return { success: true }
}

export async function changeTaskStatus(id: number, status: string) {
  await requireUserId()
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  if (!task) throw new Error("Task not found")

  const updates: Record<string, unknown> = { status }

  if (status === "done") {
    if (task.repeatFrequency !== "once") {
      const nextDueDate = getNextOccurrence(task.dueDate, task.repeatFrequency)
      updates.dueDate = nextDueDate
      updates.nextReminderAt = getNextReminderAt(nextDueDate, task.reminderOffsetDays)
      updates.isRead = false
      updates.status = "pending"
    } else {
      updates.isRead = true
    }
  } else if (status === "in_progress") {
    updates.isRead = true
  } else if (status === "pending") {
    updates.nextReminderAt = getNextReminderAt(task.dueDate, task.reminderOffsetDays)
    updates.isRead = false
  }

  await db.update(tasks).set(updates).where(eq(tasks.id, id))
  revalidatePath("/dashboard/tasks")
  return { success: true }
}

export async function getTaskNotificationCount() {
  await requireUserId()
  const now = new Date()
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(and(ne(tasks.status, "done"), ne(tasks.status, "in_progress"), lte(tasks.nextReminderAt, now)))

  return Number(result?.count || 0)
}
