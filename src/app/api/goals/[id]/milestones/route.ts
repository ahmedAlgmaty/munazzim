import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/goals/:id/milestones — إضافة مرحلة للهدف
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const title = String(body.title ?? '').trim()
    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }
    const count = await db.milestone.count({ where: { goalId: id } })
    const milestone = await db.milestone.create({
      data: { title, goalId: id, order: count },
    })
    return NextResponse.json(milestone, { status: 201 })
  } catch (e) {
    console.error('POST /api/goals/:id/milestones', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
