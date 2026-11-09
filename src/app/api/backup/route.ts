import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Rec = Record<string, unknown>

function recs(v: unknown): Rec[] {
  return Array.isArray(v) ? (v as Rec[]) : []
}
function str(v: unknown, fb = ''): string {
  return v == null ? fb : String(v)
}
function num(v: unknown, fb = 0): number {
  const n = Number(v)
  return Number.isNaN(n) ? fb : n
}
function bool(v: unknown): boolean {
  return Boolean(v)
}
function dt(v: unknown): Date | null {
  if (v == null || v === '') return null
  const x = new Date(String(v))
  return Number.isNaN(x.getTime()) ? null : x
}

// GET /api/backup — تصدير نسخة احتياطية كاملة من كل البيانات (JSON)
export async function GET() {
  try {
    const [tasks, goals, visions, settings] = await Promise.all([
      db.task.findMany({ orderBy: { createdAt: 'asc' } }),
      db.goal.findMany({ include: { milestones: { orderBy: { order: 'asc' } } } }),
      db.vision.findMany(),
      db.setting.findMany(),
    ])
    const dump = {
      app: 'munazzim',
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      goals,
      visions,
      settings,
    }
    const date = new Date().toISOString().slice(0, 10)
    return new NextResponse(JSON.stringify(dump, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="munazzim-backup-${date}.json"`,
        'cache-control': 'no-store',
      },
    })
  } catch (e) {
    console.error('GET /api/backup', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

// POST /api/backup — استعادة من ملف نسخة احتياطية (دمج بدون حذف)
export async function POST(req: NextRequest) {
  try {
    const body: Rec = (await req.json()) as Rec
    const goals = recs(body.goals)
    const tasks = recs(body.tasks)
    const visions = recs(body.visions)
    const settings = recs(body.settings)
    const goalIds = new Set(goals.map((g) => str(g.id)))

    // 1) الأهداف ثم معالمها
    let milestonesRestored = 0
    let goalsRestored = 0
    for (const g of goals) {
      if (!g.id || !g.title) continue
      const data = {
        title: str(g.title),
        horizon: str(g.horizon, '1Y'),
        targetDate: dt(g.targetDate),
        achieved: bool(g.achieved),
        updatedAt: dt(g.updatedAt) ?? new Date(),
      }
      await db.goal.upsert({
        where: { id: str(g.id) },
        create: { id: str(g.id), createdAt: dt(g.createdAt) ?? new Date(), ...data },
        update: data,
      })
      goalsRestored++
      for (const m of recs(g.milestones)) {
        if (!m.id || !m.title) continue
        const md = {
          title: str(m.title),
          done: bool(m.done),
          order: num(m.order),
          goalId: str(g.id),
        }
        await db.milestone.upsert({
          where: { id: str(m.id) },
          create: { id: str(m.id), ...md },
          update: md,
        })
        milestonesRestored++
      }
    }

    // 2) المهام (نربط goalId فقط إن كان الهدف موجودًا في الملف)
    let tasksRestored = 0
    for (const t of tasks) {
      if (!t.id || !t.title) continue
      const goalId = t.goalId && goalIds.has(str(t.goalId)) ? str(t.goalId) : null
      const data = {
        title: str(t.title),
        notes: t.notes == null ? null : str(t.notes),
        priority: str(t.priority, 'MEDIUM'),
        scope: str(t.scope, 'DAY'),
        status: str(t.status, 'OPEN'),
        completedAt: dt(t.completedAt),
        pomodoros: num(t.pomodoros),
        goalId,
        updatedAt: dt(t.updatedAt) ?? new Date(),
      }
      await db.task.upsert({
        where: { id: str(t.id) },
        create: { id: str(t.id), createdAt: dt(t.createdAt) ?? new Date(), ...data },
        update: data,
      })
      tasksRestored++
    }

    // 3) الرؤية والإعدادات
    let visionsRestored = 0
    for (const v of visions) {
      if (!v.id) continue
      const data = { body: str(v.body), updatedAt: dt(v.updatedAt) ?? new Date() }
      await db.vision.upsert({
        where: { id: str(v.id) },
        create: { id: str(v.id), ...data },
        update: data,
      })
      visionsRestored++
    }

    let settingsRestored = 0
    for (const s of settings) {
      if (!s.id) continue
      const data = {
        language: str(s.language, 'ar'),
        pomodoroWork: num(s.pomodoroWork, 25),
        pomodoroBreak: num(s.pomodoroBreak, 5),
      }
      await db.setting.upsert({
        where: { id: str(s.id) },
        create: { id: str(s.id), ...data },
        update: data,
      })
      settingsRestored++
    }

    return NextResponse.json({
      ok: true,
      restored: {
        goals: goalsRestored,
        milestones: milestonesRestored,
        tasks: tasksRestored,
        visions: visionsRestored,
        settings: settingsRestored,
      },
    })
  } catch (e) {
    console.error('POST /api/backup', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
