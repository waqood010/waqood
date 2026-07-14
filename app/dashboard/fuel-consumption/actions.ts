"use server"

import { db } from "@/lib/db"
import { fuelConsumption, tankMeasurements, tanks, stations, fuelTypes } from "@/lib/db/schema"
import { eq, desc, and, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId, isAdminRole } from "@/lib/session"

// ─── Lookups ────────────────────────────────────────────────────────────────

export async function getStationsWithTanks() {
  await requireUserId()
  const allStations = await db.select().from(stations)
  const allTanks = await db
    .select({
      id: tanks.id,
      name: tanks.name,
      stationId: tanks.stationId,
      capacityLiter: tanks.capacityLiter,
      currentBalance: tanks.currentBalance,
      minAlertLevel: tanks.minAlertLevel,
      fuelTypeId: tanks.fuelTypeId,
      fuelType: {
        id: fuelTypes.id,
        name: fuelTypes.name,
        tonToLiter: fuelTypes.tonToLiter,
      },
    })
    .from(tanks)
    .innerJoin(fuelTypes, eq(tanks.fuelTypeId, fuelTypes.id))

  return { stations: allStations, tanks: allTanks }
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getFuelConsumptions(filters?: {
  stationId?: number
  tankId?: number
  fuelTypeId?: number
  from?: Date
  to?: Date
}) {
  await requireUserId()

  const conditions = []
  if (filters?.stationId) conditions.push(eq(fuelConsumption.stationId, filters.stationId))
  if (filters?.tankId) conditions.push(eq(fuelConsumption.tankId, filters.tankId))
  if (filters?.fuelTypeId) conditions.push(eq(fuelConsumption.fuelTypeId, filters.fuelTypeId))
  if (filters?.from) conditions.push(gte(fuelConsumption.date, filters.from))
  if (filters?.to) conditions.push(lte(fuelConsumption.date, filters.to))

  const rows = await db
    .select({
      id: fuelConsumption.id,
      quantity: fuelConsumption.quantity,
      notes: fuelConsumption.notes,
      date: fuelConsumption.date,
      userId: fuelConsumption.userId,
      station: { id: stations.id, name: stations.name },
      tank: { id: tanks.id, name: tanks.name },
      fuelType: { id: fuelTypes.id, name: fuelTypes.name },
    })
    .from(fuelConsumption)
    .innerJoin(stations, eq(fuelConsumption.stationId, stations.id))
    .innerJoin(tanks, eq(fuelConsumption.tankId, tanks.id))
    .innerJoin(fuelTypes, eq(fuelConsumption.fuelTypeId, fuelTypes.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(fuelConsumption.date))

  return rows
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createFuelConsumption(data: {
  stationId: number
  tankId: number
  fuelTypeId: number
  quantity: number
  date: Date
  notes?: string
  actualReading?: number // Optional actual tank measurement reading
}) {
  const userId = await requireUserId()

  // Validate: check balance
  const tank = await db.query.tanks.findFirst({ where: eq(tanks.id, data.tankId) })
  if (!tank) throw new Error("الخزان غير موجود")

  if (data.quantity > tank.currentBalance) {
    throw new Error(
      `لا يمكن صرف ${data.quantity.toLocaleString()} لتر. الرصيد الحالي المتاح هو ${tank.currentBalance.toLocaleString()} لتر فقط.`
    )
  }

  // Use transaction to ensure data integrity
  return await db.transaction(async (tx) => {
    // 1. Create consumption record
    const [consumption] = await tx
      .insert(fuelConsumption)
      .values({
        stationId: data.stationId,
        tankId: data.tankId,
        fuelTypeId: data.fuelTypeId,
        quantity: data.quantity,
        notes: data.notes || null,
        date: data.date,
        userId,
      })
      .returning()

    const newBalance = tank.currentBalance - data.quantity

    // 2. Update tank balance
    await tx
      .update(tanks)
      .set({ currentBalance: newBalance })
      .where(eq(tanks.id, data.tankId))

    // 3. Create actual measurement record if provided
    if (data.actualReading !== undefined && data.actualReading !== null) {
      const theoreticalQuantity = newBalance
      const difference = data.actualReading - theoreticalQuantity
      
      // Calculate status based on difference (example: +- 100 liters is acceptable)
      let status = "matched"
      if (Math.abs(difference) > 0 && Math.abs(difference) <= 100) {
        status = "acceptable"
      } else if (Math.abs(difference) > 100) {
        status = "review"
      }

      await tx
        .insert(tankMeasurements)
        .values({
          stationId: data.stationId,
          tankId: data.tankId,
          actualQuantity: data.actualReading,
          theoreticalQuantity,
          difference,
          status,
          date: data.date,
          userId,
        })
    }

    return consumption
  })
}

// ─── Delete (admin only) ─────────────────────────────────────────────────────

export async function deleteFuelConsumption(id: number, role: string) {
  if (!isAdminRole(role)) throw new Error("غير مصرح لك بهذا الإجراء")

  const consumption = await db.query.fuelConsumption.findFirst({
    where: eq(fuelConsumption.id, id),
  })
  if (!consumption) throw new Error("السجل غير موجود")

  const tank = await db.query.tanks.findFirst({ where: eq(tanks.id, consumption.tankId) })
  if (!tank) throw new Error("الخزان غير موجود")

  // Restore tank balance (add the consumed quantity back)
  // Check if it exceeds capacity
  const newBalance = tank.currentBalance + consumption.quantity
  if (newBalance > tank.capacityLiter) {
    throw new Error("لا يمكن استرداد الكمية لأنها ستتجاوز السعة القصوى للخزان")
  }

  await db
    .update(tanks)
    .set({ currentBalance: newBalance })
    .where(eq(tanks.id, consumption.tankId))

  await db.delete(fuelConsumption).where(eq(fuelConsumption.id, id))
  revalidatePath("/dashboard/fuel-consumption")
  revalidatePath("/dashboard")
}
