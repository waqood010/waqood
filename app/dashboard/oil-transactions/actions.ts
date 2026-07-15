"use server"

import { db } from "@/lib/db"
import { oilTransactions, oils, consumers, user } from "@/lib/db/schema"
import { eq, desc, sql, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId, getCurrentUser, isAdminRole } from "@/lib/session"
import { logAction } from "@/lib/db/audit"

export async function getOilTransactions(filters?: {
  consumerId?: number
  oilId?: number
  from?: Date
  to?: Date
  search?: string
  status?: "all" | "approved" | "pending" | "rejected"
  page?: number
  pageSize?: number
}) {
  await requireUserId()

  const conditions: any[] = []
  if (filters?.consumerId) conditions.push(eq(oilTransactions.consumerId, filters.consumerId))
  if (filters?.oilId) conditions.push(eq(oilTransactions.oilId, filters.oilId))
  if (filters?.from) conditions.push(sql`${oilTransactions.date} >= ${filters.from}`)
  if (filters?.to) conditions.push(sql`${oilTransactions.date} <= ${filters.to}`)
  if (filters?.status && filters.status !== "all") conditions.push(eq(oilTransactions.status, filters.status))
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
      status: oilTransactions.status,
      rejectionReason: oilTransactions.rejectionReason,
      rejectedBy: oilTransactions.rejectedBy,
      rejectedAt: oilTransactions.rejectedAt,
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
  const currentUser = await getCurrentUser()

  // Get current oil balance to make sure there's enough stock
  const [targetOil] = await db.select().from(oils).where(eq(oils.id, data.oilId))
  if (!targetOil) throw new Error("الصنف المحدد غير موجود")
  if (targetOil.currentBalance < data.quantity) {
    throw new Error(`الرصيد الحالي غير كافٍ. المتبقي: ${targetOil.currentBalance} ${targetOil.unit}`)
  }

  // Determine status: admin/superadmin auto-approve, others pending
  const status = isAdminRole(currentUser?.role) ? "approved" : "pending"

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
    status: status,
  }).returning()

  // Only decrease oil balance if approved
  if (status === "approved") {
    await db.execute(sql`
      UPDATE oils 
      SET current_balance = current_balance - ${data.quantity} 
      WHERE id = ${data.oilId}
    `).catch(err => console.error("Failed to update oil balance:", err))
  }

  await logAction("create", "oil_transactions", newTransaction.id, null, newTransaction)

  revalidatePath("/dashboard/oil-transactions")
  return newTransaction
}

export async function deleteOilTransaction(id: number) {
  const userId = await requireUserId()
  
  const [existing] = await db.select().from(oilTransactions).where(eq(oilTransactions.id, id))
  if (existing) {
    // Only revert oil balance if transaction was approved
    if (existing.status === "approved") {
      await db.execute(sql`
        UPDATE oils 
        SET current_balance = current_balance + ${existing.quantity} 
        WHERE id = ${existing.oilId}
      `).catch(err => console.error("Failed to revert oil balance:", err))
    }

    await db.delete(oilTransactions).where(eq(oilTransactions.id, id))
    await logAction("delete", "oil_transactions", id, existing, null)
  }
  
  revalidatePath("/dashboard/oil-transactions")
  return { success: true }
}

export async function updateOilTransaction(id: number, data: {
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

  // Get existing transaction
  const [existing] = await db.select().from(oilTransactions).where(eq(oilTransactions.id, id))
  if (!existing) throw new Error("العملية المحددة غير موجودة")
  
  // Only allow editing approved transactions
  if (existing.status !== "approved") throw new Error("يمكن تعديل العمليات الموافق عليها فقط")

  // Get target oil
  const [targetOil] = await db.select().from(oils).where(eq(oils.id, data.oilId))
  if (!targetOil) throw new Error("الصنف المحدد غير موجود")

  // Calculate balance difference
  const quantityDifference = data.quantity - existing.quantity

  // Check if oil change or quantity increase requires sufficient balance
  if (quantityDifference > 0) {
    if (targetOil.currentBalance < quantityDifference) {
      throw new Error(`الرصيد الحالي غير كافٍ. المتبقي: ${targetOil.currentBalance} ${targetOil.unit}`)
    }
  }

  // Update transaction
  const [updated] = await db
    .update(oilTransactions)
    .set({
      date: new Date(data.date),
      quantity: data.quantity,
      serialNumber: data.serialNumber ? Number(data.serialNumber) : null,
      dispenserName: data.dispenserName,
      receiverName: data.receiverName,
      receiverRank: data.receiverRank,
      notes: data.notes,
      oilId: data.oilId,
      consumerId: data.consumerId,
    })
    .where(eq(oilTransactions.id, id))
    .returning()

  // Update oil balance if quantity or oil changed
  if (data.oilId === existing.oilId && quantityDifference !== 0) {
    // Same oil, just adjust balance
    await db.execute(sql`
      UPDATE oils 
      SET current_balance = current_balance - ${quantityDifference} 
      WHERE id = ${data.oilId}
    `).catch(err => console.error("Failed to update oil balance:", err))
  } else if (data.oilId !== existing.oilId) {
    // Oil changed, revert old and deduct new
    await db.execute(sql`
      UPDATE oils 
      SET current_balance = current_balance + ${existing.quantity} 
      WHERE id = ${existing.oilId}
    `).catch(err => console.error("Failed to revert old oil balance:", err))

    await db.execute(sql`
      UPDATE oils 
      SET current_balance = current_balance - ${data.quantity} 
      WHERE id = ${data.oilId}
    `).catch(err => console.error("Failed to deduct new oil balance:", err))
  }

  await logAction("update", "oil_transactions", id, existing, updated)

  revalidatePath("/dashboard/oil-transactions")
  return updated
}

export async function approveOilTransaction(id: number) {
  const userId = await requireUserId()
  const currentUser = await getCurrentUser()
  
  // Only admins can approve
  if (!isAdminRole(currentUser?.role)) throw new Error("Unauthorized")

  const [existing] = await db.select().from(oilTransactions).where(eq(oilTransactions.id, id))
  if (!existing) throw new Error("العملية المحددة غير موجودة")
  if (existing.status !== "pending") throw new Error("يمكن الموافقة على العمليات المعلقة فقط")

  // Get current oil balance to make sure there's enough stock
  const [targetOil] = await db.select().from(oils).where(eq(oils.id, existing.oilId))
  if (!targetOil) throw new Error("الصنف المحدد غير موجود")
  if (targetOil.currentBalance < existing.quantity) {
    throw new Error(`الرصيد الحالي غير كافٍ. المتبقي: ${targetOil.currentBalance} ${targetOil.unit}`)
  }

  // Update transaction status
  const [updated] = await db
    .update(oilTransactions)
    .set({
      status: "approved",
      rejectionReason: null,
      rejectedBy: null,
      rejectedAt: null,
    })
    .where(eq(oilTransactions.id, id))
    .returning()

  // Decrease oil balance
  await db.execute(sql`
    UPDATE oils 
    SET current_balance = current_balance - ${existing.quantity} 
    WHERE id = ${existing.oilId}
  `).catch(err => console.error("Failed to update oil balance:", err))

  await logAction("update", "oil_transactions", id, existing, updated)
  revalidatePath("/dashboard/oil-transactions")
  return updated
}

export async function rejectOilTransaction(id: number, reason: string) {
  const userId = await requireUserId()
  const currentUser = await getCurrentUser()
  
  // Only admins can reject
  if (!isAdminRole(currentUser?.role)) throw new Error("Unauthorized")

  const [existing] = await db.select().from(oilTransactions).where(eq(oilTransactions.id, id))
  if (!existing) throw new Error("العملية المحددة غير موجودة")
  if (existing.status !== "pending") throw new Error("يمكن رفض العمليات المعلقة فقط")

  // Update transaction status
  const [updated] = await db
    .update(oilTransactions)
    .set({
      status: "rejected",
      rejectionReason: reason,
      rejectedBy: userId,
      rejectedAt: new Date(),
    })
    .where(eq(oilTransactions.id, id))
    .returning()

  await logAction("update", "oil_transactions", id, existing, updated)
  revalidatePath("/dashboard/oil-transactions")
  return updated
}
