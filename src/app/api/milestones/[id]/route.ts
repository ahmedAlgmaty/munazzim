import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/milestones/:id — إنجاز/تعديل مرحلة
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
    if (typeof body.done === 'boolean') data.done = body.done
    const milestone = await db.milestone.update({ where: { id }, data })
    return NextResponse.json(milestone)
  } catch (e) {
    console.error('PATCH /api/milestones/:id', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// DELETE /api/milestones/:id — حذف مرحلة
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await db.milestone.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/milestones/:id', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
