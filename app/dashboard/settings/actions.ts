"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { systemSettings, fuelTypes, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId, getCurrentUser, isAdminRole } from "@/lib/session"
import { logAction } from "@/lib/db/audit"

// -- Fuel Types Actions --

export async function createFuelType(data: { name: string; tonToLiter: number; minAlertLevel: number; criticalAlertPercent: number }) {
  await requireUserId()
  
  const [newFuelType] = await db.insert(fuelTypes).values({
    name: data.name,
    tonToLiter: data.tonToLiter,
    minAlertLevel: data.minAlertLevel,
    criticalAlertPercent: data.criticalAlertPercent,
  }).returning()

  await logAction("create", "fuel_types", newFuelType.id, null, newFuelType)
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function updateFuelType(id: number, data: { name: string; tonToLiter: number; minAlertLevel: number; criticalAlertPercent: number }) {
  await requireUserId()
  
  const [existing] = await db.select().from(fuelTypes).where(eq(fuelTypes.id, id))
  
  await db.update(fuelTypes).set({
    name: data.name,
    tonToLiter: data.tonToLiter,
    minAlertLevel: data.minAlertLevel,
    criticalAlertPercent: data.criticalAlertPercent,
  }).where(eq(fuelTypes.id, id))

  await logAction("update", "fuel_types", id, existing, data)
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function deleteFuelType(id: number) {
  await requireUserId()
  
  const [existing] = await db.select().from(fuelTypes).where(eq(fuelTypes.id, id))
  await db.delete(fuelTypes).where(eq(fuelTypes.id, id))
  await logAction("delete", "fuel_types", id, existing, null)
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function createUser(data: { name: string; username: string; password: string; role: "admin" | "user" }) {
  await requireUserId()

  const current = await getCurrentUser()
  if (!current || !isAdminRole(current.role)) throw new Error("Unauthorized")

  // Admins (non-super) can only create normal users
  if (current.role !== "superadmin" && data.role === "admin") {
    throw new Error("Unauthorized")
  }

  const email = `${data.username}@transport.gov.eg`
  const signUpRes = await auth.api.signUpEmail({
    body: {
      email,
      password: data.password,
      name: data.name,
      username: data.username,
      role: data.role,
    },
  })

  const userId = signUpRes.user.id
  await db.update(user).set({ role: data.role }).where(eq(user.id, userId))

  const newUser = {
    id: userId,
    name: data.name,
    username: data.username,
    email,
    role: data.role,
    createdAt: new Date().toISOString(),
  }

  await logAction("create", "user", userId, null, newUser)
  revalidatePath("/dashboard/settings")
  return newUser
}

// -- System Settings Actions --

export async function updateSystemSetting(key: string, value: string) {
  await requireUserId()
  
  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.settingKey, key)
  })

  if (existing) {
    await db.update(systemSettings).set({
      settingValue: value,
      updatedAt: new Date()
    }).where(eq(systemSettings.settingKey, key))
  } else {
    await db.insert(systemSettings).values({
      settingKey: key,
      settingValue: value,
    })
  }

  revalidatePath("/dashboard/settings")
  return { success: true }
}
