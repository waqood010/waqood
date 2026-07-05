"use server"

import { db } from "@/lib/db"
import { oilTransactions, oils, consumers } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"
import { logAction } from "@/lib/db/audit"

export async function getOilTransactions() {
  await requireUserId()
  
  return await db
    .select({
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
    .orderBy(desc(oilTransactions.date))
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
