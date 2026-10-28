import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks — كل المهام
export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { goal: { select: { id: true, title: true } } },
    })
    return NextResponse.json(tasks)
  } catch (e) {
    console.error('GET /api/tasks', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// POST /api/tasks — إنشاء مهمة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const title = String(body.title ?? '').trim()
    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 })
    }
    const task = await db.task.create({
      data: {
        title,
        notes: body.notes ? String(body.notes) : null,
        priority: ['HIGH', 'MEDIUM', 'LOW'].includes(body.priority) ? body.priority : 'MEDIUM',
        scope: ['DAY', 'WEEK', 'MONTH'].includes(body.scope) ? body.scope : 'DAY',
        goalId: body.goalId || null,
      },
      include: { goal: { select: { id: true, title: true } } },
    })
    return NextResponse.json(task, { status: 201 })
  } catch (e) {
    console.error('POST /api/tasks', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
