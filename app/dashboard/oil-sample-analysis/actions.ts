"use server"

import { db } from "@/lib/db"
import { oilSampleAnalyses, oils } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUserId } from "@/lib/session"

export async function getOilSampleAnalyses() {
  await requireUserId()

  return await db
    .select({
      id: oilSampleAnalyses.id,
      analysisNumber: oilSampleAnalyses.analysisNumber,
      analysisDate: oilSampleAnalyses.analysisDate,
      resultDate: oilSampleAnalyses.resultDate,
      status: oilSampleAnalyses.status,
      cost: oilSampleAnalyses.cost,
      notes: oilSampleAnalyses.notes,
      oilId: oilSampleAnalyses.oilId,
      oilName: oils.name,
    })
    .from(oilSampleAnalyses)
    .innerJoin(oils, eq(oilSampleAnalyses.oilId, oils.id))
    .orderBy(desc(oilSampleAnalyses.analysisDate))
}

export async function getOils() {
  await requireUserId()
  return await db.select({ id: oils.id, name: oils.name }).from(oils).orderBy(oils.name)
}

export async function createOilSampleAnalysis(data: {
  analysisNumber: string
  analysisDate: string
  resultDate: string | null
  status: string
  cost: number
  notes?: string | null
  oilId: number
}) {
  const userId = await requireUserId()

  const [newAnalysis] = await db.insert(oilSampleAnalyses).values({
    analysisNumber: data.analysisNumber,
    analysisDate: new Date(data.analysisDate),
    resultDate: data.resultDate ? new Date(data.resultDate) : null,
    status: data.status,
    cost: data.cost,
    notes: data.notes || null,
    oilId: data.oilId,
    userId,
  }).returning()

  revalidatePath("/dashboard/oil-sample-analysis")
  return newAnalysis
}

export async function updateOilSampleAnalysis(id: number, data: {
  analysisNumber: string
  analysisDate: string
  resultDate: string | null
  status: string
  cost: number
  notes?: string | null
  oilId: number
}) {
  await requireUserId()

  const [updated] = await db.update(oilSampleAnalyses).set({
    analysisNumber: data.analysisNumber,
    analysisDate: new Date(data.analysisDate),
    resultDate: data.resultDate ? new Date(data.resultDate) : null,
    status: data.status,
    cost: data.cost,
    notes: data.notes || null,
    oilId: data.oilId,
  }).where(eq(oilSampleAnalyses.id, id)).returning()

  revalidatePath("/dashboard/oil-sample-analysis")
  return updated
}

export async function deleteOilSampleAnalysis(id: number) {
  await requireUserId()

  await db.delete(oilSampleAnalyses).where(eq(oilSampleAnalyses.id, id))
  revalidatePath("/dashboard/oil-sample-analysis")
  return { success: true }
}
