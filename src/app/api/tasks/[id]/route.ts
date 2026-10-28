import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/tasks/:id — تحديث مهمة (إكمال، استعادة، تعديل، عدّاد بومودورو)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const data: Record<string, unknown> = {}

    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
    if ('notes' in body) data.notes = body.notes ? String(body.notes) : null
    if (['HIGH', 'MEDIUM', 'LOW'].includes(body.priority)) data.priority = body.priority
    if (['DAY', 'WEEK', 'MONTH'].includes(body.scope)) data.scope = body.scope
    if ('goalId' in body) data.goalId = body.goalId || null

    // إكمال / استعادة — الأرشفة التلقائية
    if (body.status === 'DONE') {
      data.status = 'DONE'
      data.completedAt = new Date()
    } else if (body.status === 'OPEN') {
      data.status = 'OPEN'
      data.completedAt = null
    }

    // عدّاد جلسات بومودورو
    if (typeof body.pomodoroInc === 'number' && body.pomodoroInc > 0) {
      const current = await db.task.findUnique({ where: { id }, select: { pomodoros: true } })
      if (current) data.pomodoros = current.pomodoros + Math.floor(body.pomodoroInc)
    }

    const task = await db.task.update({
      where: { id },
      data,
      include: { goal: { select: { id: true, title: true } } },
    })
    return NextResponse.json(task)
  } catch (e) {
    console.error('PATCH /api/tasks/:id', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// DELETE /api/tasks/:id — حذف نهائي
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    await db.task.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('DELETE /api/tasks/:id', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
