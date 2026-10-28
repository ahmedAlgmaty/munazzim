import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/goals/:id — تحديث هدف
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
    if (['1Y', '3Y', '5Y'].includes(body.horizon)) data.horizon = body.horizon
    if (typeof body.achieved === 'boolean') data.achieved = body.achieved
    if ('targetDate' in body) data.targetDate = body.targetDate ? new Date(body.targetDate) : null

    const goal = await db.goal.update({
      where: { id },
      data,
      include: { milestones: { orderBy: { order: 'asc' } }, tasks: { where: { status: 'OPEN' }, select: { id: true } } },
    })
    return NextResponse.json(goal)
  } catch (e) {
    console.error('PATCH /api/goals/:id', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// DELETE /api/goals/:id — حذف هدف (مراحله تُحذف تلقائياً، مهامه تبقى)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await db.goal.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/goals/:id', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
