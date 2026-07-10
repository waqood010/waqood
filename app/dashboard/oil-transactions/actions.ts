"use server"

import { db } from "@/lib/db"
import { oilTransactions, oils, consumers } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"
import { logAction } from "@/lib/db/audit"

export async function getOilTransactions(filters?: {
  consumerId?: number
  oilId?: number
  from?: Date
  to?: Date
  search?: string
  page?: number
  pageSize?: number
}) {
  await requireUserId()

  const conditions: any[] = []
  if (filters?.consumerId) conditions.push(eq(oilTransactions.consumerId, filters.consumerId))
  if (filters?.oilId) conditions.push(eq(oilTransactions.oilId, filters.oilId))
  if (filters?.from) conditions.push(sql`${oilTransactions.date} >= ${filters.from}`)
  if (filters?.to) conditions.push(sql`${oilTransactions.date} <= ${filters.to}`)
  if (filters?.search) {
    const term = `%${filters.search}%`
    conditions.push(sql`(
      ${oils.name} ILIKE ${term} OR
      ${consumers.name} ILIKE ${term} OR
      ${oilTransactions.dispenserName} ILIKE ${term} OR
      ${oilTransactions.receiverName} ILIKE ${term} OR
      CAST(${oilTransactions.serialNumber} AS TEXT) ILIKE ${term}
    )`)
  }

  const page = filters?.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters?.pageSize && filters.pageSize > 0 ? filters.pageSize : 25
  const limit = pageSize + 1 // fetch one extra to detect next page
  const offset = (page - 1) * pageSize

  const rows = await db
    .select({
      oilId: oilTransactions.oilId,
      consumerId: oilTransactions.consumerId,
      id: oilTransactions.id,
      date: oilTransactions.date,
      quantity: oilTransactions.quantity,
      serialNumber: oilTransactions.serialNumber,
      dispenserName: oilTransactions.dispenserName,
      receiverName: oilTransactions.receiverName,
      receiverRank: oilTransactions.receiverRank,
      notes: oilTransactions.notes,
      oilName: oils.name,
      consumerName: consumers.name,
    })
    .from(oilTransactions)
    .innerJoin(oils, eq(oilTransactions.oilId, oils.id))
    .innerJoin(consumers, eq(oilTransactions.consumerId, consumers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(oilTransactions.date))
    .limit(limit)
    .offset(offset)

  const hasMore = rows.length > pageSize
  const data = rows.slice(0, pageSize)
  return { data, hasMore, page, pageSize }
}

export async function getConsumersAndOils() {
  await requireUserId()
  const allConsumers = await db.select().from(consumers)
  const allOils = await db.select().from(oils)
  return { consumers: allConsumers, oils: allOils }
}

export async function createOilTransaction(data: {
  date: string
  quantity: number
  serialNumber: string | null
  dispenserName: string
  receiverName: string
  receiverRank: string | null
  notes: string | null
  oilId: number
  consumerId: number
}) {
  const userId = await requireUserId()

  // Get current oil balance to make sure there's enough stock
  const [targetOil] = await db.select().from(oils).where(eq(oils.id, data.oilId))
  if (!targetOil) throw new Error("الصنف المحدد غير موجود")
  if (targetOil.currentBalance < data.quantity) {
    throw new Error(`الرصيد الحالي غير كافٍ. المتبقي: ${targetOil.currentBalance} ${targetOil.unit}`)
  }

  const [newTransaction] = await db.insert(oilTransactions).values({
    date: new Date(data.date),
    quantity: data.quantity,
    serialNumber: data.serialNumber ? Number(data.serialNumber) : null,
    dispenserName: data.dispenserName,
    receiverName: data.receiverName,
    receiverRank: data.receiverRank,
    notes: data.notes,
    oilId: data.oilId,
    consumerId: data.consumerId,
    userId: userId,
  }).returning()

  // Decrease oil balance
  await db.execute(sql`
    UPDATE oils 
    SET current_balance = current_balance - ${data.quantity} 
    WHERE id = ${data.oilId}
  `).catch(err => console.error("Failed to update oil balance:", err))

  await logAction("create", "oil_transactions", newTransaction.id, null, newTransaction)

  revalidatePath("/dashboard/oil-transactions")
  return newTransaction
}

export async function deleteOilTransaction(id: number) {
  const userId = await requireUserId()
  
  const [existing] = await db.select().from(oilTransactions).where(eq(oilTransactions.id, id))
  if (existing) {
    // Revert oil balance
    await db.execute(sql`
      UPDATE oils 
      SET current_balance = current_balance + ${existing.quantity} 
      WHERE id = ${existing.oilId}
    `).catch(err => console.error("Failed to revert oil balance:", err))

    await db.delete(oilTransactions).where(eq(oilTransactions.id, id))
    await logAction("delete", "oil_transactions", id, existing, null)
  }
  
  revalidatePath("/dashboard/oil-transactions")
  return { success: true }
}
