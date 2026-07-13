"use server"

import { db } from "@/lib/db"
import { oils, oilTransactions, oilSupplies } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

export async function getOils() {
  await requireUserId()
  return await db.select().from(oils).orderBy(oils.id)
}

export async function createOil(data: {
  name: string
  unit: string
  unitPrice?: number
  packsPerCarton?: number
  barrelQuantity?: number
  aggregateUnit?: string
  aggregateUnitQuantity?: number
  minAlertLevel: number
  currentBalance?: number
  notes?: string
}) {
  await requireUserId()

  const [newOil] = await db
    .insert(oils)
    .values({
      name: data.name,
      unit: data.unit,
      unitPrice: data.unitPrice || 0,
      packsPerCarton: data.packsPerCarton || 0,
      barrelQuantity: data.barrelQuantity || 0,
      aggregateUnit: data.aggregateUnit || null,
      aggregateUnitQuantity: data.aggregateUnitQuantity || 0,
      currentBalance: data.currentBalance || 0,
      minAlertLevel: data.minAlertLevel || 0,
      notes: data.notes || null,
    })
    .returning()

  revalidatePath("/dashboard/oils")
  return newOil
}

export async function updateOil(id: number, data: {
  name: string
  unit: string
  unitPrice?: number
  packsPerCarton?: number
  barrelQuantity?: number
  aggregateUnit?: string
  aggregateUnitQuantity?: number
  minAlertLevel: number
  currentBalance?: number
  notes?: string
}) {
  await requireUserId()

  const [updatedOil] = await db
    .update(oils)
    .set({
      name: data.name,
      unit: data.unit,
      unitPrice: data.unitPrice || 0,
      packsPerCarton: data.packsPerCarton || 0,
      barrelQuantity: data.barrelQuantity || 0,
      aggregateUnit: data.aggregateUnit || null,
      aggregateUnitQuantity: data.aggregateUnitQuantity || 0,
      currentBalance: data.currentBalance || 0,
      minAlertLevel: data.minAlertLevel || 0,
      notes: data.notes || null,
    })
    .where(eq(oils.id, id))
    .returning()

  revalidatePath("/dashboard/oils")
  return updatedOil
}

export async function deleteOil(id: number, role: string) {
  if (role !== "admin") throw new Error("غير مصرح لك بهذا الإجراء")

  // Check if oil has transactions or supplies
  const transactions = await db.select().from(oilTransactions).where(eq(oilTransactions.oilId, id)).limit(1)
  const supplies = await db.select().from(oilSupplies).where(eq(oilSupplies.oilId, id)).limit(1)

  if (transactions.length > 0 || supplies.length > 0) {
    throw new Error("لا يمكن حذف هذا الصنف لارتباطه بحركات وارد أو منصرف.")
  }

  await db.delete(oils).where(eq(oils.id, id))
  revalidatePath("/dashboard/oils")
  return { success: true }
}
