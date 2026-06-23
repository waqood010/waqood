"use server"

import { db } from "@/lib/db"
import { consumers, oilConsumptionRates, oilTransactions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

export async function getConsumers() {
  await requireUserId()
  return await db.select().from(consumers).orderBy(consumers.id)
}

export async function createConsumer(data: { name: string; type?: string; notes?: string }) {
  await requireUserId()
  const [newConsumer] = await db.insert(consumers).values({
    name: data.name,
    type: data.type || null,
    notes: data.notes || null,
  }).returning()
  
  revalidatePath("/dashboard/consumers")
  return newConsumer
}

export async function updateConsumer(id: number, data: { name: string; type?: string; notes?: string }) {
  await requireUserId()
  const [updatedConsumer] = await db.update(consumers).set({
    name: data.name,
    type: data.type || null,
    notes: data.notes || null,
  }).where(eq(consumers.id, id)).returning()
  
  revalidatePath("/dashboard/consumers")
  return updatedConsumer
}

export async function deleteConsumer(id: number, role: string) {
  if (role !== "admin") throw new Error("غير مصرح لك بهذا الإجراء")

  const rates = await db.select().from(oilConsumptionRates).where(eq(oilConsumptionRates.consumerId, id)).limit(1)
  const transactions = await db.select().from(oilTransactions).where(eq(oilTransactions.consumerId, id)).limit(1)

  if (rates.length > 0 || transactions.length > 0) {
    throw new Error("لا يمكن حذف هذه الجهة لارتباطها بمعدلات استهلاك أو حركات صرف.")
  }

  await db.delete(consumers).where(eq(consumers.id, id))
  revalidatePath("/dashboard/consumers")
  return { success: true }
}
