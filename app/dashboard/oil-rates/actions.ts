"use server"

import { db } from "@/lib/db"
import { oilConsumptionRates, consumers, oils } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

export async function getOilRates() {
  await requireUserId()
  return await db
    .select({
      id: oilConsumptionRates.id,
      consumerId: oilConsumptionRates.consumerId,
      oilId: oilConsumptionRates.oilId,
      rate: oilConsumptionRates.rate,
      period: oilConsumptionRates.period,
      consumer: { id: consumers.id, name: consumers.name },
      oil: { id: oils.id, name: oils.name, unit: oils.unit },
    })
    .from(oilConsumptionRates)
    .innerJoin(consumers, eq(oilConsumptionRates.consumerId, consumers.id))
    .innerJoin(oils, eq(oilConsumptionRates.oilId, oils.id))
}

export async function getConsumersAndOils() {
  await requireUserId()
  const allConsumers = await db.select().from(consumers)
  const allOils = await db.select().from(oils)
  return { consumers: allConsumers, oils: allOils }
}

export async function createOilRate(data: {
  consumerId: number
  oilId: number
  rate: number
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

  const [newRate] = await db.insert(oilConsumptionRates).values({
    consumerId: data.consumerId,
    oilId: data.oilId,
    rate: data.rate,
    period: data.period,
  }).returning()

  revalidatePath("/dashboard/oil-rates")
  return newRate
}

export async function updateOilRate(id: number, data: { rate: number; period: string }) {
  await requireUserId()

  const [updatedRate] = await db.update(oilConsumptionRates).set({
    rate: data.rate,
    period: data.period,
  }).where(eq(oilConsumptionRates.id, id)).returning()

  revalidatePath("/dashboard/oil-rates")
  return updatedRate
}

export async function deleteOilRate(id: number, role: string) {
  if (role !== "admin") throw new Error("غير مصرح لك بهذا الإجراء")

  await db.delete(oilConsumptionRates).where(eq(oilConsumptionRates.id, id))
  revalidatePath("/dashboard/oil-rates")
  return { success: true }
}
