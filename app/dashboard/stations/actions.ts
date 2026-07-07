"use server"

import { db } from "@/lib/db"
import { stations, tanks, fuelTypes } from "@/lib/db/schema"
import { eq, count } from "drizzle-orm"
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

  return stationTanks
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
}) {
  await requireUserId()
  
  const fuelType = await db.query.fuelTypes.findFirst({
    where: eq(fuelTypes.id, data.fuelTypeId)
  })

  if (!fuelType) throw new Error("نوع الوقود غير موجود")

  const capacityLiter = data.capacityTon * fuelType.tonToLiter

  const [newTank] = await db.insert(tanks).values({
    name: data.name,
    stationId: data.stationId,
    fuelTypeId: data.fuelTypeId,
    capacityTon: data.capacityTon,
    capacityLiter: capacityLiter,
    minAlertLevel: data.minAlertLevel,
    currentBalance: 0,
  }).returning()

  revalidatePath("/dashboard/stations")
  return newTank
}

export async function updateTank(id: number, data: {
  name: string
  fuelTypeId: number
  capacityTon: number
  minAlertLevel: number
}) {
  await requireUserId()
  
  const fuelType = await db.query.fuelTypes.findFirst({
    where: eq(fuelTypes.id, data.fuelTypeId)
  })

  if (!fuelType) throw new Error("نوع الوقود غير موجود")

  const capacityLiter = data.capacityTon * fuelType.tonToLiter

  const [updatedTank] = await db.update(tanks).set({
    name: data.name,
    fuelTypeId: data.fuelTypeId,
    capacityTon: data.capacityTon,
    capacityLiter: capacityLiter,
    minAlertLevel: data.minAlertLevel,
  }).where(eq(tanks.id, id)).returning()

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
