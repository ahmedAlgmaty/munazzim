import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/vision — الرؤية الشخصية
export async function GET() {
  try {
    let vision = await db.vision.findUnique({ where: { id: 'main' } })
    if (!vision) {
      vision = await db.vision.create({ data: { id: 'main', body: '' } })
    }
    return NextResponse.json(vision)
  } catch (e) {
    console.error('GET /api/vision', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// PUT /api/vision — حفظ نص الرؤية
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const text = String(body.body ?? '')
    const vision = await db.vision.upsert({
      where: { id: 'main' },
      update: { body: text },
      create: { id: 'main', body: text },
    })
    return NextResponse.json(vision)
  } catch (e) {
    console.error('PUT /api/vision', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
