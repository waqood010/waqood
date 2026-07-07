"use server"

import { db } from "@/lib/db"
import { fuelSupplies, fuelSupplyDistributions, tanks, stations, fuelTypes } from "@/lib/db/schema"
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

// ─── Get Next Import Number for Station ──────────────────────────────────────

export async function getNextImportNumber(stationId: number): Promise<number> {
  const result = await db
    .select({ max: sql<number>`COALESCE(MAX(import_number), 0)` })
    .from(fuelSupplyDistributions)
    .where(eq(fuelSupplyDistributions.stationId, stationId))
  return (result[0]?.max ?? 0) + 1
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getFuelSupplies(monthDate?: Date) {
  await requireUserId()

  // Use current month if not specified
  const date = monthDate || new Date()
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

  const rows = await db
    .select({
      id: fuelSupplies.id,
      documentNumber: fuelSupplies.documentNumber,
      invoiceNumber: fuelSupplies.invoiceNumber,
      supplierCompany: fuelSupplies.supplierCompany,
      totalQuantity: fuelSupplies.totalQuantity,
      unitPrice: fuelSupplies.unitPrice,
      totalPrice: fuelSupplies.totalPrice,
      date: fuelSupplies.date,
      userId: fuelSupplies.userId,
      fuelType: { id: fuelTypes.id, name: fuelTypes.name },
    })
    .from(fuelSupplies)
    .innerJoin(fuelTypes, eq(fuelSupplies.fuelTypeId, fuelTypes.id))
    .where(
      and(
        gte(fuelSupplies.date, startOfMonth),
        lte(fuelSupplies.date, endOfMonth)
      )
    )
    .orderBy(desc(fuelSupplies.date))

  return rows
}

// ─── Get Supply Distributions ────────────────────────────────────────────────

export async function getSupplyDistributions(supplyId: number) {
  await requireUserId()

  const distributions = await db
    .select({
      id: fuelSupplyDistributions.id,
      supplyId: fuelSupplyDistributions.supplyId,
      stationId: fuelSupplyDistributions.stationId,
      tankId: fuelSupplyDistributions.tankId,
      quantity: fuelSupplyDistributions.quantity,
      importNumber: fuelSupplyDistributions.importNumber,
      station: { id: stations.id, name: stations.name },
      tank: { id: tanks.id, name: tanks.name },
      fuelType: { id: fuelTypes.id, name: fuelTypes.name },
    })
    .from(fuelSupplyDistributions)
    .innerJoin(stations, eq(fuelSupplyDistributions.stationId, stations.id))
    .innerJoin(tanks, eq(fuelSupplyDistributions.tankId, tanks.id))
    .innerJoin(fuelTypes, eq(tanks.fuelTypeId, fuelTypes.id))
    .where(eq(fuelSupplyDistributions.supplyId, supplyId))
    .orderBy(fuelSupplyDistributions.stationId)

  return distributions
}

// ─── Get Full Supply Details ─────────────────────────────────────────────────

export async function getSupplyWithDistributions(supplyId: number) {
  await requireUserId()

  const supply = await db.query.fuelSupplies.findFirst({
    where: eq(fuelSupplies.id, supplyId),
  })

  if (!supply) throw new Error("السجل غير موجود")

  const distributions = await getSupplyDistributions(supplyId)

  return {
    ...supply,
    distributions,
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createFuelSupply(data: {
  fuelTypeId: number
  totalQuantity: number
  unitPrice: number
  invoiceNumber?: string
  supplierCompany?: string
  date: Date
  distributions: Array<{
    stationId: number
    tankId: number
    quantity: number
    importNumber: number
  }>
}) {
  const userId = await requireUserId()

  // Validate: sum of distribution quantities should equal totalQuantity
  const sumQuantity = data.distributions.reduce((sum, d) => sum + d.quantity, 0)
  if (sumQuantity !== data.totalQuantity) {
    throw new Error(
      `مجموع الكميات الموزعة (${sumQuantity.toLocaleString()}) يجب أن يساوي الكمية الإجمالية (${data.totalQuantity.toLocaleString()})`
    )
  }

  // Validate each distribution: check capacity
  for (const dist of data.distributions) {
    const tank = await db.query.tanks.findFirst({
      where: eq(tanks.id, dist.tankId),
    })
    if (!tank) throw new Error(`الخزان غير موجود: ${dist.tankId}`)

    const freeCapacity = tank.capacityLiter - tank.currentBalance
    if (dist.quantity > freeCapacity) {
      throw new Error(
        `الكمية المطلوبة للخزان "${tank.name}" (${dist.quantity.toLocaleString()} لتر) تتجاوز السعة المتاحة (${freeCapacity.toLocaleString()} لتر)`
      )
    }
  }

  const documentNumber = await getNextDocumentNumber()
  const totalPrice = data.totalQuantity * data.unitPrice

  // Create supply record
  const [supply] = await db
    .insert(fuelSupplies)
    .values({
      documentNumber,
      invoiceNumber: data.invoiceNumber || null,
      supplierCompany: data.supplierCompany || null,
      fuelTypeId: data.fuelTypeId,
      totalQuantity: data.totalQuantity,
      unitPrice: data.unitPrice,
      totalPrice,
      date: data.date,
      userId,
    })
    .returning()

  // Create distributions
  for (const dist of data.distributions) {
    await db.insert(fuelSupplyDistributions).values({
      supplyId: supply.id,
      stationId: dist.stationId,
      tankId: dist.tankId,
      quantity: dist.quantity,
      importNumber: dist.importNumber,
    })

    // Update tank balance
    const tank = await db.query.tanks.findFirst({
      where: eq(tanks.id, dist.tankId),
    })
    if (tank) {
      await db
        .update(tanks)
        .set({ currentBalance: tank.currentBalance + dist.quantity })
        .where(eq(tanks.id, dist.tankId))
    }
  }

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

  // Get all distributions
  const distributions = await db.query.fuelSupplyDistributions.findMany({
    where: eq(fuelSupplyDistributions.supplyId, id),
  })

  // Restore tank balances
  for (const dist of distributions) {
    const tank = await db.query.tanks.findFirst({
      where: eq(tanks.id, dist.tankId),
    })
    if (tank) {
      await db
        .update(tanks)
        .set({ currentBalance: Math.max(0, tank.currentBalance - dist.quantity) })
        .where(eq(tanks.id, dist.tankId))
    }
  }

  // Delete supply (cascade delete will handle distributions)
  await db.delete(fuelSupplies).where(eq(fuelSupplies.id, id))

  revalidatePath("/dashboard/fuel-supplies")
  revalidatePath("/dashboard")
}
