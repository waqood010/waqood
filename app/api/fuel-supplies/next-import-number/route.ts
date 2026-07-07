import { NextResponse } from 'next/server'
import { getNextImportNumber } from '@/app/dashboard/fuel-supplies/actions'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const stationId = Number(url.searchParams.get('stationId'))
    if (!stationId) return new Response(JSON.stringify({ error: 'stationId required' }), { status: 400 })
    const next = await getNextImportNumber(stationId)
    return NextResponse.json({ next })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 })
  }
}
