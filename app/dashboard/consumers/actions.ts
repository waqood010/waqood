"use server"

import { db } from "@/lib/db"
import { consumers, oilConsumptionRates, oilTransactions, oils } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId, isAdminRole } from "@/lib/session"
import { addDays, addMonths } from "date-fns"

export async function getConsumers() {
  await requireUserId()
  return await db.select().from(consumers).orderBy(consumers.id)
}

export async function getConsumersWithRatesAndOils() {
  await requireUserId()
  
  const allConsumers = await db.select().from(consumers).orderBy(consumers.id)
  const allOils = await db.select().from(oils).orderBy(oils.name)
  
  return { consumers: allConsumers, oils: allOils }
}

export async function getConsumerWithRates(consumerId: number) {
  await requireUserId()
  
  const consumer = await db.select().from(consumers).where(eq(consumers.id, consumerId)).limit(1)
  
  const rates = await db
    .select({
      id: oilConsumptionRates.id,
      consumerId: oilConsumptionRates.consumerId,
      oilId: oilConsumptionRates.oilId,
      oilName: oils.name,
      rate: oilConsumptionRates.rate,
      unit: oilConsumptionRates.unit,
      period: oilConsumptionRates.period,
      nextRefillDate: oilConsumptionRates.nextRefillDate,
    })
    .from(oilConsumptionRates)
    .innerJoin(oils, eq(oilConsumptionRates.oilId, oils.id))
    .where(eq(oilConsumptionRates.consumerId, consumerId))
    .orderBy(oils.name)

  return { consumer: consumer[0], rates }
}

export async function getLastTransactionDate(consumerId: number, oilId: number) {
  await requireUserId()
  
  const lastTransaction = await db
    .select({ date: oilTransactions.date })
    .from(oilTransactions)
    .where(and(
      eq(oilTransactions.consumerId, consumerId),
      eq(oilTransactions.oilId, oilId)
    ))
    .orderBy(desc(oilTransactions.date))
    .limit(1)

  return lastTransaction[0]?.date || null
}

export async function calculateNextRefillDate(consumerId: number, oilId: number, period: string) {
  await requireUserId()
  
  const lastDate = await getLastTransactionDate(consumerId, oilId)
  const baseDate = lastDate ? new Date(lastDate) : new Date()
  
  if (period === "weekly") {
    return addDays(baseDate, 7)
  } else {
    return addMonths(baseDate, 1)
  }
}

export async function createOilRate(data: {
  consumerId: number
  oilId: number
  rate: number
  unit: string
  period: string
}) {
  await requireUserId()

  // Prevent duplicate consumer-oil pair
  const existing = await db.select().from(oilConsumptionRates).where(
    and(
      eq(oilConsumptionRates.consumerId, data.consumerId),
      eq(oilConsumptionRates.oilId, data.oilId)
    )
  )
  if (existing.length > 0) {
    throw new Error("هذا الصنف مخصص لهذه الجهة مسبقاً. يمكنك تعديل المعدل بدلاً من إضافة جديد.")
  }

  // Calculate initial next refill date
  const nextRefillDate = await calculateNextRefillDate(data.consumerId, data.oilId, data.period)

  const [newRate] = await db.insert(oilConsumptionRates).values({
    consumerId: data.consumerId,
    oilId: data.oilId,
    rate: data.rate,
    unit: data.unit,
    period: data.period,
    nextRefillDate: nextRefillDate,
  }).returning()

  revalidatePath("/dashboard/consumers")
  return newRate
}

export async function updateOilRate(id: number, data: { rate: number; unit: string; period: string }) {
  await requireUserId()

  const [updatedRate] = await db.update(oilConsumptionRates).set({
    rate: data.rate,
    unit: data.unit,
    period: data.period,
  }).where(eq(oilConsumptionRates.id, id)).returning()

  revalidatePath("/dashboard/consumers")
  return updatedRate
}

export async function deleteOilRate(id: number, role: string) {
  if (!isAdminRole(role)) throw new Error("غير مصرح لك بهذا الإجراء")

  await db.delete(oilConsumptionRates).where(eq(oilConsumptionRates.id, id))
  revalidatePath("/dashboard/consumers")
  return { success: true }
}

export async function updateNextRefillDate(rateId: number, nextRefillDate: string | null) {
  await requireUserId()
  
  const [updated] = await db
    .update(oilConsumptionRates)
    .set({
      nextRefillDate: nextRefillDate ? new Date(nextRefillDate) : null,
    })
    .where(eq(oilConsumptionRates.id, rateId))
    .returning()

  revalidatePath("/dashboard/consumers")
  return updated
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
  if (!isAdminRole(role)) throw new Error("غير مصرح لك بهذا الإجراء")

  const rates = await db.select().from(oilConsumptionRates).where(eq(oilConsumptionRates.consumerId, id)).limit(1)
  const transactions = await db.select().from(oilTransactions).where(eq(oilTransactions.consumerId, id)).limit(1)

  if (rates.length > 0 || transactions.length > 0) {
    throw new Error("لا يمكن حذف هذه الجهة لارتباطها بمعدلات استهلاك أو حركات صرف.")
  }

  await db.delete(consumers).where(eq(consumers.id, id))
  revalidatePath("/dashboard/consumers")
  return { success: true }
}
