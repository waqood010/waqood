"use server"

import { db, pool } from "@/lib/db"
import { fuelSupplies, fuelSupplyDistributions, tanks, stations, fuelTypes } from "@/lib/db/schema"
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

async function getFuelSupplyLegacyColumns() {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'fuel_supplies'
        AND table_schema = 'public'
        AND column_name IN ('station_id', 'tank_id', 'quantity')
    `,
  )
  const rows = (result.rows ?? []) as Array<{ column_name: string }>
  return new Set(rows.map((row) => row.column_name))
}

async function insertFuelSupplyRow(values: {
  documentNumber: number
  invoiceNumber: string | null
  supplierCompany: string | null
  fuelTypeId: number
  totalQuantity: number
  unitPrice: number
  totalPrice: number
  date: Date
  userId: string
  stationId?: number
  tankId?: number
  quantity?: number
}) {
  const legacyColumns = await getFuelSupplyLegacyColumns()

  if (legacyColumns.size === 0) {
    const [supply] = await db.insert(fuelSupplies).values(values).returning()
    return supply
  }

  const columns = [
    "document_number",
    "invoice_number",
    "supplier_company",
    "fuel_type_id",
    "total_quantity",
    "unit_price",
    "total_price",
    "date",
    '"userId"',
  ]
  const params: unknown[] = [
    values.documentNumber,
    values.invoiceNumber,
    values.supplierCompany,
    values.fuelTypeId,
    values.totalQuantity,
    values.unitPrice,
    values.totalPrice,
    values.date,
    values.userId,
  ]

  if (legacyColumns.has("station_id")) {
    columns.push("station_id")
    params.push(values.stationId ?? null)
  }
  if (legacyColumns.has("tank_id")) {
    columns.push("tank_id")
    params.push(values.tankId ?? null)
  }
  if (legacyColumns.has("quantity")) {
    columns.push("quantity")
    params.push(values.quantity ?? null)
  }

  const placeholders = params.map((_, index) => `$${index + 1}`)
  const query = `INSERT INTO fuel_supplies (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id, document_number, invoice_number, supplier_company, fuel_type_id, total_quantity, unit_price, total_price, date, "userId", created_at`
  const result = await pool.query(query, params as any[])
  const rows = ((result as any).rows ?? []) as Array<any>
  return rows[0]
}

async function updateFuelSupplyRow(id: number, values: {
  documentNumber: number
  invoiceNumber: string | null
  supplierCompany: string | null
  fuelTypeId: number
  totalQuantity: number
  unitPrice: number
  totalPrice: number
  date: Date
  userId: string
  stationId?: number
  tankId?: number
  quantity?: number
}) {
  const legacyColumns = await getFuelSupplyLegacyColumns()
  const columns = [
    "document_number",
    "invoice_number",
    "supplier_company",
    "fuel_type_id",
    "total_quantity",
    "unit_price",
    "total_price",
    "date",
    '"userId"',
  ]
  const params: unknown[] = [
    values.documentNumber,
    values.invoiceNumber,
    values.supplierCompany,
    values.fuelTypeId,
    values.totalQuantity,
    values.unitPrice,
    values.totalPrice,
    values.date,
    values.userId,
  ]

  if (legacyColumns.has("station_id")) {
    columns.push("station_id")
    params.push(values.stationId ?? null)
  }
  if (legacyColumns.has("tank_id")) {
    columns.push("tank_id")
    params.push(values.tankId ?? null)
  }
  if (legacyColumns.has("quantity")) {
    columns.push("quantity")
    params.push(values.quantity ?? null)
  }

  const setPairs = columns.map((col, index) => `${col} = $${index + 1}`)
  const query = `UPDATE fuel_supplies SET ${setPairs.join(", ")} WHERE id = $${params.length + 1} RETURNING id, document_number, invoice_number, supplier_company, fuel_type_id, total_quantity, unit_price, total_price, date, "userId", created_at`
  const result = await pool.query(query, [...params, id] as any[])
  const rows = ((result as any).rows ?? []) as Array<any>
  return rows[0]
}

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

export async function getNextDocumentNumber(): Promise<number> {
  await requireUserId()
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

export async function getFuelSupplies(from?: Date, to?: Date, stationId?: number) {
  await requireUserId()

  // Use current month-from-first to today if not specified
  const now = new Date()
  const startOfMonth = from ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfDay = to ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  try {
    if (stationId) {
      const rows = await db
        .select({
          id: fuelSupplies.id,
          distributionId: fuelSupplyDistributions.id,
          documentNumber: fuelSupplies.documentNumber,
          invoiceNumber: fuelSupplies.invoiceNumber,
          supplierCompany: fuelSupplies.supplierCompany,
          totalQuantity: fuelSupplyDistributions.quantity,
          unitPrice: fuelSupplies.unitPrice,
          totalPrice: sql<number>`COALESCE(${fuelSupplies.unitPrice} * ${fuelSupplyDistributions.quantity}, 0)`,
          date: fuelSupplies.date,
          importNumber: fuelSupplyDistributions.importNumber,
          userId: fuelSupplies.userId,
          fuelType: { id: fuelTypes.id, name: fuelTypes.name },
        })
        .from(fuelSupplies)
        .innerJoin(fuelSupplyDistributions, eq(fuelSupplyDistributions.supplyId, fuelSupplies.id))
        .innerJoin(fuelTypes, eq(fuelSupplies.fuelTypeId, fuelTypes.id))
        .where(
          and(
            gte(fuelSupplies.date, startOfMonth),
            lte(fuelSupplies.date, endOfDay),
            eq(fuelSupplyDistributions.stationId, stationId)
          )
        )
        .orderBy(asc(fuelSupplies.documentNumber), desc(fuelSupplies.date))

      return rows
    }

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
          lte(fuelSupplies.date, endOfDay)
        )
      )
      .orderBy(asc(fuelSupplies.documentNumber), desc(fuelSupplies.date))

    return rows
  } catch (err) {
    // Fallback: if DB wasn't migrated (no total_quantity column), compute total by summing distributions
    const rows = await db
      .select({
        id: fuelSupplies.id,
        documentNumber: fuelSupplies.documentNumber,
        invoiceNumber: fuelSupplies.invoiceNumber,
        supplierCompany: fuelSupplies.supplierCompany,
        // sum quantity from distributions as totalQuantity
        totalQuantity: sql<number>`COALESCE(SUM(${fuelSupplyDistributions}.quantity), 0)`,
        unitPrice: fuelSupplies.unitPrice,
        totalPrice: fuelSupplies.totalPrice,
        date: fuelSupplies.date,
        userId: fuelSupplies.userId,
        fuelType: { id: fuelTypes.id, name: fuelTypes.name },
      })
      .from(fuelSupplies)
      .leftJoin(fuelSupplyDistributions, eq(fuelSupplyDistributions.supplyId, fuelSupplies.id))
      .innerJoin(fuelTypes, eq(fuelSupplies.fuelTypeId, fuelTypes.id))
      .where(
        and(
          gte(fuelSupplies.date, startOfMonth),
          lte(fuelSupplies.date, endOfDay)
        )
      )
      .groupBy(
        fuelSupplies.id,
        fuelSupplies.documentNumber,
        fuelSupplies.invoiceNumber,
        fuelSupplies.supplierCompany,
        fuelSupplies.unitPrice,
        fuelSupplies.totalPrice,
        fuelSupplies.date,
        fuelSupplies.userId,
        fuelTypes.id,
        fuelTypes.name
      )
    .orderBy(asc(fuelSupplies.documentNumber), desc(fuelSupplies.date))

    return rows as any
  }
}

// ─── Get Supply Distributions ────────────────────────────────────────────────────────────────

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

export async function updateFuelSupply(id: number, data: {
  documentNumber: number
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

  const existingSupply = await db.query.fuelSupplies.findFirst({
    where: eq(fuelSupplies.id, id),
  })

  if (!existingSupply) {
    throw new Error("السجل غير موجود")
  }

  const sumQuantity = data.distributions.reduce((sum, d) => sum + d.quantity, 0)
  if (sumQuantity !== data.totalQuantity) {
    throw new Error(
      `مجموع الكميات الموزعة (${sumQuantity.toLocaleString()}) يجب أن يساوي الكمية الإجمالية (${data.totalQuantity.toLocaleString()})`
    )
  }

  const oldDistributions = await db.query.fuelSupplyDistributions.findMany({
    where: eq(fuelSupplyDistributions.supplyId, id),
  })

  const tankIds = new Set<number>()
  oldDistributions.forEach((dist) => tankIds.add(dist.tankId))
  data.distributions.forEach((dist) => tankIds.add(dist.tankId))

  const tanksById = new Map<number, { currentBalance: number; capacityLiter: number; name: string }>()
  for (const tankId of tankIds) {
    const tank = await db.query.tanks.findFirst({
      where: eq(tanks.id, tankId),
    })
    if (!tank) {
      throw new Error(`الخزان غير موجود: ${tankId}`)
    }
    tanksById.set(tankId, {
      currentBalance: tank.currentBalance,
      capacityLiter: tank.capacityLiter,
      name: tank.name,
    })
  }

  const balanceDelta = new Map<number, number>()

  for (const dist of oldDistributions) {
    balanceDelta.set(dist.tankId, (balanceDelta.get(dist.tankId) ?? 0) - dist.quantity)
  }
  for (const dist of data.distributions) {
    balanceDelta.set(dist.tankId, (balanceDelta.get(dist.tankId) ?? 0) + dist.quantity)
  }

  for (const [tankId, delta] of balanceDelta.entries()) {
    const tank = tanksById.get(tankId)!
    const finalBalance = tank.currentBalance + delta
    if (finalBalance < 0) {
      throw new Error(`الرصيد النهائي لخزان "${tank.name}" لا يمكن أن يكون سالبًا`) 
    }
    if (finalBalance > tank.capacityLiter) {
      throw new Error(`الكمية المطلوبة للخزان "${tank.name}" تتجاوز السعة (${tank.capacityLiter.toLocaleString()} لتر)`) 
    }
  }

  const existingStationId = data.distributions[0]?.stationId
  const existingTankId = data.distributions[0]?.tankId

  await db.transaction(async (tx) => {
    const totalPrice = data.totalQuantity * data.unitPrice

    await updateFuelSupplyRow(id, {
      documentNumber: data.documentNumber,
      invoiceNumber: data.invoiceNumber || null,
      supplierCompany: data.supplierCompany || null,
      fuelTypeId: data.fuelTypeId,
      totalQuantity: data.totalQuantity,
      unitPrice: data.unitPrice,
      totalPrice,
      date: data.date,
      userId,
      stationId: existingStationId,
      tankId: existingTankId,
      quantity: data.totalQuantity,
    })

    await tx.delete(fuelSupplyDistributions).where(eq(fuelSupplyDistributions.supplyId, id))

    for (const dist of data.distributions) {
      await tx.insert(fuelSupplyDistributions).values({
        supplyId: id,
        stationId: dist.stationId,
        tankId: dist.tankId,
        quantity: dist.quantity,
        importNumber: dist.importNumber,
      })
    }

    for (const [tankId, delta] of balanceDelta.entries()) {
      const tank = tanksById.get(tankId)!
      await tx.update(tanks).set({ currentBalance: tank.currentBalance + delta }).where(eq(tanks.id, tankId))
    }
  })

  revalidatePath("/dashboard/fuel-supplies")
  revalidatePath("/dashboard")
}

export async function createFuelSupply(data: {
  documentNumber?: number
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

  const documentNumber = data.documentNumber ?? (await getNextDocumentNumber())
  const totalPrice = data.totalQuantity * data.unitPrice
  const firstDistribution = data.distributions[0]

  // Create supply record
  const supply = await insertFuelSupplyRow({
    documentNumber,
    invoiceNumber: data.invoiceNumber || null,
    supplierCompany: data.supplierCompany || null,
    fuelTypeId: data.fuelTypeId,
    totalQuantity: data.totalQuantity,
    unitPrice: data.unitPrice,
    totalPrice,
    date: data.date,
    userId,
    stationId: firstDistribution?.stationId,
    tankId: firstDistribution?.tankId,
    quantity: data.totalQuantity,
  })

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
