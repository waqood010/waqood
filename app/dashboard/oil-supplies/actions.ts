"use server"

import { db } from "@/lib/db"
import { oilSupplies, oils } from "@/lib/db/schema"
import { eq, desc, sql, and, gte, lte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"
import { logAction } from "@/lib/db/audit"

export async function getOilSupplies(fromDate?: string, toDate?: string) {
  await requireUserId()
  
  let query = db
    .select({
      id: oilSupplies.id,
      date: oilSupplies.date,
      quantity: oilSupplies.quantity,
      price: oilSupplies.price,
      supplier: oilSupplies.supplier,
      invoiceNumber: oilSupplies.invoiceNumber,
      contractNumber: oilSupplies.contractNumber,
      notes: oilSupplies.notes,
      oilId: oilSupplies.oilId,
      oilName: oils.name,
      unitPrice: oils.unitPrice,
      aggregateUnit: oils.aggregateUnit,
      aggregateUnitQuantity: oils.aggregateUnitQuantity,
      unit: oils.unit,
    })
    .from(oilSupplies)
    .innerJoin(oils, eq(oilSupplies.oilId, oils.id))

  // Add date range filters if provided
  if (fromDate && toDate) {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    to.setHours(23, 59, 59, 999)
    
    query = query.where(
      and(
        gte(oilSupplies.date, from),
        lte(oilSupplies.date, to)
      )
    )
  }

  return await query.orderBy(desc(oilSupplies.date))
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
  contractNumber: string | null
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
    contractNumber: data.contractNumber,
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

export async function updateOilSupply(id: number, data: {
  date: string
  quantity: number
  price: number
  supplier: string
  invoiceNumber: string | null
  contractNumber: string | null
  notes: string | null
  oilId: number
}) {
  const userId = await requireUserId()

  const [existing] = await db.select().from(oilSupplies).where(eq(oilSupplies.id, id))
  if (!existing) throw new Error("Supply not found")

  const quantityDifference = data.quantity - existing.quantity

  const [updatedSupply] = await db.update(oilSupplies)
    .set({
      date: new Date(data.date),
      quantity: data.quantity,
      price: data.price,
      supplier: data.supplier,
      invoiceNumber: data.invoiceNumber,
      contractNumber: data.contractNumber,
      notes: data.notes,
      oilId: data.oilId,
    })
    .where(eq(oilSupplies.id, id))
    .returning()

  // Update oil balance if quantity or oilId changed
  if (quantityDifference !== 0 || data.oilId !== existing.oilId) {
    if (existing.oilId === data.oilId) {
      // Same oil, just adjust by the difference
      await db.execute(sql`
        UPDATE oils 
        SET current_balance = current_balance + ${quantityDifference} 
        WHERE id = ${data.oilId}
      `).catch(err => console.error("Failed to update oil balance:", err))
    } else {
      // Different oil, revert old and add to new
      await db.execute(sql`
        UPDATE oils 
        SET current_balance = current_balance - ${existing.quantity} 
        WHERE id = ${existing.oilId}
      `).catch(err => console.error("Failed to revert oil balance:", err))

      await db.execute(sql`
        UPDATE oils 
        SET current_balance = current_balance + ${data.quantity} 
        WHERE id = ${data.oilId}
      `).catch(err => console.error("Failed to update new oil balance:", err))
    }
  }

  await logAction("update", "oil_supplies", id, existing, updatedSupply)

  revalidatePath("/dashboard/oil-supplies")
  return updatedSupply
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
