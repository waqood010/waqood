import { NextResponse } from 'next/server'
import { getFuelSupplies } from '@/app/dashboard/fuel-supplies/actions'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const fromParam = url.searchParams.get('from') // format YYYY-MM-DD
    const toParam = url.searchParams.get('to') // format YYYY-MM-DD
    const stationId = Number(url.searchParams.get('stationId')) || undefined

    let from: Date | undefined = undefined
    let to: Date | undefined = undefined

    if (fromParam) {
      const parts = fromParam.split('-')
      if (parts.length === 3) {
        const y = Number(parts[0])
        const m = Number(parts[1]) - 1
        const d = Number(parts[2])
        from = new Date(y, m, d, 0, 0, 0, 0)
      }
    }

    if (toParam) {
      const parts = toParam.split('-')
      if (parts.length === 3) {
        const y = Number(parts[0])
        const m = Number(parts[1]) - 1
        const d = Number(parts[2])
        to = new Date(y, m, d, 23, 59, 59, 999)
      }
    }

    const rows = await getFuelSupplies(from, to, stationId)
    return NextResponse.json(rows)
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 })
  }
}
