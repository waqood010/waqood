import { NextResponse } from 'next/server'
import { getFuelSupplies } from '@/app/dashboard/fuel-supplies/actions'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const month = url.searchParams.get('month') // format YYYY-MM
    let date: Date | undefined = undefined
    if (month) {
      const parts = month.split('-')
      if (parts.length === 2) {
        const y = Number(parts[0])
        const m = Number(parts[1]) - 1
        date = new Date(y, m, 1)
      }
    }

    const rows = await getFuelSupplies(date)
    return NextResponse.json(rows)
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 })
  }
}
