import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings — الإعدادات
export async function GET() {
  try {
    let settings = await db.setting.findUnique({ where: { id: 'main' } })
    if (!settings) {
      settings = await db.setting.create({ data: { id: 'main' } })
    }
    return NextResponse.json(settings)
  } catch (e) {
    console.error('GET /api/settings', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// PUT /api/settings — تحديث الإعدادات
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (['ar', 'en'].includes(body.language)) data.language = body.language
    if (typeof body.pomodoroWork === 'number' && body.pomodoroWork >= 5 && body.pomodoroWork <= 90) {
      data.pomodoroWork = Math.floor(body.pomodoroWork)
    }
    if (typeof body.pomodoroBreak === 'number' && body.pomodoroBreak >= 1 && body.pomodoroBreak <= 30) {
      data.pomodoroBreak = Math.floor(body.pomodoroBreak)
    }
    const settings = await db.setting.upsert({
      where: { id: 'main' },
      update: data,
      create: { id: 'main', ...data },
    })
    return NextResponse.json(settings)
  } catch (e) {
    console.error('PUT /api/settings', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
