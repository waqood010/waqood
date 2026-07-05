"use server"

import { db } from "@/lib/db"
import { oilSupplies, oils } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"
import { logAction } from "@/lib/db/audit"

export async function getOilSupplies() {
  await requireUserId()
  
  return await db
    .select({
      id: oilSupplies.id,
      date: oilSupplies.date,
      quantity: oilSupplies.quantity,
      price: oilSupplies.price,
      supplier: oilSupplies.supplier,
      invoiceNumber: oilSupplies.invoiceNumber,
      notes: oilSupplies.notes,
      oilName: oils.name,
    })
    .from(oilSupplies)
    .innerJoin(oils, eq(oilSupplies.oilId, oils.id))
    .orderBy(desc(oilSupplies.date))
}

export async function getOils() {
  await requireUserId()
  return await db.select().from(oils)
}

export async function createOilSupply(data: {
  date: string
  quantity: number
  price: number
  supplier: string
  invoiceNumber: string | null
  notes: string | null
  oilId: number
}) {
  const userId = await requireUserId()

  const [newSupply] = await db.insert(oilSupplies).values({
    date: new Date(data.date),
    quantity: data.quantity,
    price: data.price,
    supplier: data.supplier,
    invoiceNumber: data.invoiceNumber,
    notes: data.notes,
    oilId: data.oilId,
    userId: userId,
  }).returning()

  // Update current oil balance
  await db.execute(sql`
    UPDATE oils 
    SET current_balance = current_balance + ${data.quantity} 
    WHERE id = ${data.oilId}
  `).catch(err => console.error("Failed to update oil balance:", err))

  await logAction("create", "oil_supplies", newSupply.id, null, newSupply)

  revalidatePath("/dashboard/oil-supplies")
  return newSupply
}

export async function deleteOilSupply(id: number) {
  const userId = await requireUserId()
  
  const [existing] = await db.select().from(oilSupplies).where(eq(oilSupplies.id, id))
  if (existing) {
    // Revert current oil balance
    await db.execute(sql`
      UPDATE oils 
      SET current_balance = current_balance - ${existing.quantity} 
      WHERE id = ${existing.oilId}
    `).catch(err => console.error("Failed to revert oil balance:", err))
    
    await db.delete(oilSupplies).where(eq(oilSupplies.id, id))
    await logAction("delete", "oil_supplies", id, existing, null)
  }
  
  revalidatePath("/dashboard/oil-supplies")
  return { success: true }
}
