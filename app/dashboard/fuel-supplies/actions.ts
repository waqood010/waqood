"use server"

import { db } from "@/lib/db"
import { fuelSupplies, tanks, stations, fuelTypes } from "@/lib/db/schema"
import { eq, desc, and, gte, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

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

// ─── Auto document number (سنوي) ────────────────────────────────────────────

async function getNextDocumentNumber(): Promise<number> {
  const currentYear = new Date().getFullYear()
  const startOfYear = new Date(currentYear, 0, 1)
  const result = await db
    .select({ max: sql<number>`COALESCE(MAX(document_number), 0)` })
    .from(fuelSupplies)
    .where(gte(fuelSupplies.date, startOfYear))
  return (result[0]?.max ?? 0) + 1
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getFuelSupplies(filters?: {
  stationId?: number
  tankId?: number
  fuelTypeId?: number
  from?: Date
  to?: Date
}) {
  await requireUserId()

  const conditions = []
  if (filters?.stationId) conditions.push(eq(fuelSupplies.stationId, filters.stationId))
  if (filters?.tankId) conditions.push(eq(fuelSupplies.tankId, filters.tankId))
  if (filters?.fuelTypeId) conditions.push(eq(fuelSupplies.fuelTypeId, filters.fuelTypeId))
  if (filters?.from) conditions.push(gte(fuelSupplies.date, filters.from))
  if (filters?.to) conditions.push(lte(fuelSupplies.date, filters.to))

  const rows = await db
    .select({
      id: fuelSupplies.id,
      documentNumber: fuelSupplies.documentNumber,
      invoiceNumber: fuelSupplies.invoiceNumber,
      supplierCompany: fuelSupplies.supplierCompany,
      quantity: fuelSupplies.quantity,
      unitPrice: fuelSupplies.unitPrice,
      totalPrice: fuelSupplies.totalPrice,
      date: fuelSupplies.date,
      userId: fuelSupplies.userId,
      station: { id: stations.id, name: stations.name },
      tank: { id: tanks.id, name: tanks.name },
      fuelType: { id: fuelTypes.id, name: fuelTypes.name },
    })
    .from(fuelSupplies)
    .innerJoin(stations, eq(fuelSupplies.stationId, stations.id))
    .innerJoin(tanks, eq(fuelSupplies.tankId, tanks.id))
    .innerJoin(fuelTypes, eq(fuelSupplies.fuelTypeId, fuelTypes.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(fuelSupplies.date))

  return rows
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createFuelSupply(data: {
  stationId: number
  tankId: number
  fuelTypeId: number
  quantity: number
  unitPrice: number
  invoiceNumber?: string
  supplierCompany?: string
  date: Date
}) {
  const userId = await requireUserId()

  // Validate: check capacity
  const tank = await db.query.tanks.findFirst({ where: eq(tanks.id, data.tankId) })
  if (!tank) throw new Error("الخزان غير موجود")

  const freeCapacity = tank.capacityLiter - tank.currentBalance
  if (data.quantity > freeCapacity) {
    throw new Error(
      `الكمية المطلوبة (${data.quantity.toLocaleString()} لتر) تتجاوز السعة المتاحة (${freeCapacity.toLocaleString()} لتر)`
    )
  }

  const documentNumber = await getNextDocumentNumber()
  const totalPrice = data.quantity * data.unitPrice

  // Create supply record
  const [supply] = await db
    .insert(fuelSupplies)
    .values({
      documentNumber,
      invoiceNumber: data.invoiceNumber || null,
      supplierCompany: data.supplierCompany || null,
      stationId: data.stationId,
      tankId: data.tankId,
      fuelTypeId: data.fuelTypeId,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice,
      date: data.date,
      userId,
    })
    .returning()

  // Update tank balance
  await db
    .update(tanks)
    .set({ currentBalance: tank.currentBalance + data.quantity })
    .where(eq(tanks.id, data.tankId))

  revalidatePath("/dashboard/fuel-supplies")
  revalidatePath("/dashboard")
  return supply
}

// ─── Delete (admin only) ─────────────────────────────────────────────────────

export async function deleteFuelSupply(id: number, role: string) {
  if (role !== "admin") throw new Error("غير مصرح لك بهذا الإجراء")

  const supply = await db.query.fuelSupplies.findFirst({
    where: eq(fuelSupplies.id, id),
  })
  if (!supply) throw new Error("السجل غير موجود")

  const tank = await db.query.tanks.findFirst({ where: eq(tanks.id, supply.tankId) })
  if (!tank) throw new Error("الخزان غير موجود")

  // Restore tank balance
  await db
    .update(tanks)
    .set({ currentBalance: Math.max(0, tank.currentBalance - supply.quantity) })
    .where(eq(tanks.id, supply.tankId))

  await db.delete(fuelSupplies).where(eq(fuelSupplies.id, id))
  revalidatePath("/dashboard/fuel-supplies")
  revalidatePath("/dashboard")
}
