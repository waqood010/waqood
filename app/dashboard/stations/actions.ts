"use server"

import { db } from "@/lib/db"
import { stations, tanks, fuelTypes, fuelSupplyDistributions } from "@/lib/db/schema"
import { eq, count, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

export async function getStations() {
  await requireUserId()
  
  // Fetch all stations
  const allStations = await db.select().from(stations)
  
  // Fetch all tanks with their details
  const allTanks = await db
    .select({
      id: tanks.id,
      stationId: tanks.stationId,
      name: tanks.name,
      capacityTon: tanks.capacityTon,
      capacityLiter: tanks.capacityLiter,
      startupBalance: tanks.startupBalance,
      currentBalance: tanks.currentBalance,
      minAlertLevel: tanks.minAlertLevel,
      fuelTypeId: tanks.fuelTypeId,
    })
    .from(tanks)

  // Group tanks by station
  const tanksByStation = new Map<number, typeof allTanks>()
  allTanks.forEach(tank => {
    if (!tanksByStation.has(tank.stationId)) {
      tanksByStation.set(tank.stationId, [])
    }
    tanksByStation.get(tank.stationId)!.push(tank)
  })

  return allStations.map(station => ({
    ...station,
    tanks: tanksByStation.get(station.id) || [],
  }))
}

export async function createStation(data: { name: string; notes?: string }) {
  await requireUserId()
  
  const [newStation] = await db.insert(stations).values({
    name: data.name,
    notes: data.notes || null,
  }).returning()

  revalidatePath("/dashboard/stations")
  return newStation
}

export async function updateStation(id: number, data: { name: string; notes?: string }) {
  await requireUserId()
  
  const [updatedStation] = await db.update(stations).set({
    name: data.name,
    notes: data.notes || null,
  }).where(eq(stations.id, id)).returning()

  revalidatePath("/dashboard/stations")
  return updatedStation
}

export async function deleteStation(id: number) {
  await requireUserId()
  
  // Check if it has tanks
  const stationTanks = await db.select().from(tanks).where(eq(tanks.stationId, id))
  if (stationTanks.length > 0) {
    throw new Error("لا يمكن حذف المحطة لارتباطها بخزانات.")
  }

  await db.delete(stations).where(eq(stations.id, id))
  revalidatePath("/dashboard/stations")
  return { success: true }
}

// --- Tanks ---

export async function getStationTanks(stationId: number) {
  await requireUserId()
  
  // Join tanks with fuelTypes to get fuel name
  const stationTanks = await db
    .select({
      id: tanks.id,
      name: tanks.name,
      stationId: tanks.stationId,
      capacityTon: tanks.capacityTon,
      capacityLiter: tanks.capacityLiter,
      startupBalance: tanks.startupBalance,
      currentBalance: tanks.currentBalance,
      minAlertLevel: tanks.minAlertLevel,
      fuelType: {
        id: fuelTypes.id,
        name: fuelTypes.name,
        tonToLiter: fuelTypes.tonToLiter,
      }
    })
    .from(tanks)
    .innerJoin(fuelTypes, eq(tanks.fuelTypeId, fuelTypes.id))
    .where(eq(tanks.stationId, stationId))

  const tankIds = stationTanks.map((tank) => tank.id)
  const hasSuppliesMap = new Map<number, boolean>()

  if (tankIds.length > 0) {
    const supplyCounts = await db
      .select({ tankId: fuelSupplyDistributions.tankId, count: count() })
      .from(fuelSupplyDistributions)
      .where(inArray(fuelSupplyDistributions.tankId, tankIds))
      .groupBy(fuelSupplyDistributions.tankId)

    supplyCounts.forEach((row) => {
      hasSuppliesMap.set(row.tankId, row.count > 0)
    })
  }

  return stationTanks.map((tank) => ({
    ...tank,
    hasSupplies: hasSuppliesMap.get(tank.id) ?? false,
  }))
}

export async function getFuelTypes() {
  return await db.select().from(fuelTypes)
}

export async function createTank(data: {
  name: string
  stationId: number
  fuelTypeId: number
  capacityTon: number
  minAlertLevel: number
  currentBalance: number
}) {
  await requireUserId()
  
  const fuelType = await db.query.fuelTypes.findFirst({
    where: eq(fuelTypes.id, data.fuelTypeId)
  })

  if (!fuelType) throw new Error("نوع الوقود غير موجود")

  const capacityLiter = data.capacityTon * fuelType.tonToLiter

  if (data.currentBalance < 0) {
    throw new Error("الرصيد الابتدائي لا يمكن أن يكون سالباً.")
  }
  if (data.currentBalance > capacityLiter) {
    throw new Error(`الرصيد الابتدائي أكبر من سعة الخزان (${capacityLiter.toLocaleString()} لتر).`)
  }

  const [newTank] = await db.insert(tanks).values({
    name: data.name,
    stationId: data.stationId,
    fuelTypeId: data.fuelTypeId,
    capacityTon: data.capacityTon,
    capacityLiter: capacityLiter,
    startupBalance: data.currentBalance,
    currentBalance: data.currentBalance,
    minAlertLevel: data.minAlertLevel,
  }).returning()

  revalidatePath("/dashboard/stations")
  return newTank
}

export async function updateTank(id: number, data: {
  name: string
  fuelTypeId: number
  capacityTon: number
  minAlertLevel: number
  currentBalance?: number
  hasSupplies?: boolean
}) {
  await requireUserId()
  
  const fuelType = await db.query.fuelTypes.findFirst({
    where: eq(fuelTypes.id, data.fuelTypeId)
  })

  if (!fuelType) throw new Error("نوع الوقود غير موجود")

  const capacityLiter = data.capacityTon * fuelType.tonToLiter

  if (data.currentBalance !== undefined) {
    if (data.currentBalance < 0) {
      throw new Error("الرصيد الابتدائي لا يمكن أن يكون سالباً.")
    }
    if (data.currentBalance > capacityLiter) {
      throw new Error(`الرصيد الابتدائي أكبر من سعة الخزان (${capacityLiter.toLocaleString()} لتر).`)
    }
  }

  const [existing] = await db.select().from(tanks).where(eq(tanks.id, id)).limit(1)

  const updates: Record<string, unknown> = {
    name: data.name,
    fuelTypeId: data.fuelTypeId,
    capacityTon: data.capacityTon,
    capacityLiter: capacityLiter,
    minAlertLevel: data.minAlertLevel,
  }

  if (data.currentBalance !== undefined && !data.hasSupplies) {
    updates.startupBalance = data.currentBalance
    updates.currentBalance = data.currentBalance
  }

  const [updatedTank] = await db.update(tanks).set(updates).where(eq(tanks.id, id)).returning()

  revalidatePath("/dashboard/stations")
  return updatedTank
}

export async function deleteTank(id: number) {
  await requireUserId()
  
  // Note: in a real scenario we'd check for linked transactions
  await db.delete(tanks).where(eq(tanks.id, id))
  
  revalidatePath("/dashboard/stations")
  return { success: true }
}
