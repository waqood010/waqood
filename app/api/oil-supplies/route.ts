import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getOilSupplies } from "@/app/dashboard/oil-supplies/actions"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")

    const supplies = await getOilSupplies(fromDate || undefined, toDate || undefined)
    
    return NextResponse.json(supplies)
  } catch (error: any) {
    console.error("Error fetching oil supplies:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
