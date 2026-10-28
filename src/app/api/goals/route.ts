import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/goals — الأهداف الكبرى مع مراحلها
export async function GET() {
  try {
    const goals = await db.goal.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        tasks: { where: { status: 'OPEN' }, select: { id: true } },
      },
    })
    return NextResponse.json(goals)
  } catch (e) {
    console.error('GET /api/goals', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// POST /api/goals — إنشاء هدف كبير
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const title = String(body.title ?? '').trim()
    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }
    const goal = await db.goal.create({
      data: {
        title,
        horizon: ['1Y', '3Y', '5Y'].includes(body.horizon) ? body.horizon : '1Y',
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
      },
      include: { milestones: { orderBy: { order: 'asc' } }, tasks: { where: { status: 'OPEN' }, select: { id: true } } },
    })
    return NextResponse.json(goal, { status: 201 })
  } catch (e) {
    console.error('POST /api/goals', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
