"use server"

import { db } from "@/lib/db"
import { fuelSupplies, fuelConsumption, tankMeasurements, tanks, stations, fuelTypes } from "@/lib/db/schema"
import { eq, and, gte, lt, desc } from "drizzle-orm"
import { requireUserId } from "@/lib/session"

export async function getDailyBalances(targetDateStr?: string) {
  await requireUserId()

  // Target date processing (defaults to today)
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()
  const startOfDay = new Date(targetDate)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(targetDate)
  endOfDay.setHours(24, 0, 0, 0)

  // 1. Fetch all tanks with their stations and fuel types
  const allTanks = await db
    .select({
      id: tanks.id,
      name: tanks.name,
      currentBalance: tanks.currentBalance,
      stationId: tanks.stationId,
      stationName: stations.name,
      fuelTypeId: tanks.fuelTypeId,
      fuelTypeName: fuelTypes.name,
    })
    .from(tanks)
    .innerJoin(stations, eq(tanks.stationId, stations.id))
    .innerJoin(fuelTypes, eq(tanks.fuelTypeId, fuelTypes.id))

  // 2. Fetch today's supplies
  const supplies = await db
    .select()
    .from(fuelSupplies)
    .where(and(gte(fuelSupplies.date, startOfDay), lt(fuelSupplies.date, endOfDay)))

  // 3. Fetch today's consumptions
  const consumptions = await db
    .select()
    .from(fuelConsumption)
    .where(and(gte(fuelConsumption.date, startOfDay), lt(fuelConsumption.date, endOfDay)))

  // 4. Fetch today's latest measurements
  const measurements = await db
    .select()
    .from(tankMeasurements)
    .where(and(gte(tankMeasurements.date, startOfDay), lt(tankMeasurements.date, endOfDay)))
    .orderBy(desc(tankMeasurements.date)) // We will pick the first one per tank

  // Process data per tank
  const report = allTanks.map((tank) => {
    // Sum supplies
    const tankSupplies = supplies.filter(s => s.tankId === tank.id)
    const totalSupply = tankSupplies.reduce((sum, s) => sum + s.quantity, 0)

    // Sum consumptions
    const tankConsumptions = consumptions.filter(c => c.tankId === tank.id)
    const totalConsumption = tankConsumptions.reduce((sum, c) => sum + c.quantity, 0)

    // Latest measurement
    const latestMeasurement = measurements.find(m => m.tankId === tank.id)

    // Important Logic:
    // If the target date is TODAY, the tank's currentBalance is the Theoretical Closing.
    // Opening = Closing - Supply + Consumption
    // If the target date is IN THE PAST, calculating this accurately requires historical replay,
    // but for MVP, we will assume this report is mostly viewed for "Today".
    // For a fully robust system, daily balances should be snapshotted in the `daily_balances` table.
    
    // For now, we compute based on current balance (assuming viewing today).
    const theoreticalClosing = tank.currentBalance
    const openingBalance = theoreticalClosing - totalSupply + totalConsumption
    
    const actualClosing = latestMeasurement ? latestMeasurement.actualQuantity : null
    const difference = actualClosing !== null ? actualClosing - theoreticalClosing : null
    
    let status = "none"
    if (difference !== null) {
      if (difference === 0) status = "matched"
      else if (Math.abs(difference) <= 100) status = "acceptable"
      else status = "review"
    }

    return {
      tankId: tank.id,
      tankName: tank.name,
      stationName: tank.stationName,
      fuelTypeName: tank.fuelTypeName,
      openingBalance,
      totalSupply,
      totalConsumption,
      theoreticalClosing,
      actualClosing,
      difference,
      status,
      lastMeasurementDate: latestMeasurement?.date || null
    }
  })

  // Group by Station -> FuelType
  return report
}
