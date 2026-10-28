'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3, CheckCheck, CalendarCheck2, Timer, ListTodo } from 'lucide-react'
import { useT } from '@/lib/use-t'
import { jsonFetch } from '@/lib/api'
import type { Task, Priority } from '@/lib/types'
import { PRIORITY_COLORS, BLUE, GREEN } from '@/lib/types'

// بطاقة الإحصائيات — أرقام سريعة + رسمان بيانيان
export function StatsCard() {
  const { t, lang } = useT()

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => jsonFetch('/api/tasks'),
  })

  const stats = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // الأسبوع يبدأ الأحد
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const doneTasks = tasks.filter((x) => x.status === 'DONE')
    const doneAt = (x: Task) => new Date(x.completedAt ?? x.updatedAt).getTime()

    const doneWeek = doneTasks.filter((x) => doneAt(x) >= startOfWeek.getTime()).length
    const doneMonth = doneTasks.filter((x) => doneAt(x) >= startOfMonth.getTime()).length
    const pomodoros = tasks.reduce((s, x) => s + x.pomodoros, 0)
    const openCount = tasks.filter((x) => x.status === 'OPEN').length

    // آخر 7 أيام
    const days: { day: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(d.getDate() + 1)
      const count = doneTasks.filter((x) => {
        const ts = doneAt(x)
        return ts >= d.getTime() && ts < next.getTime()
      }).length
      days.push({
        day: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-LY' : 'en-US', { weekday: 'short' }).format(d),
        count,
      })
    }

    // توزيع الأولويات للمهام المفتوحة
    const byPriority = (['HIGH', 'MEDIUM', 'LOW'] as Priority[]).map((p) => ({
      name: p === 'HIGH' ? t.high : p === 'MEDIUM' ? t.medium : t.low,
      value: tasks.filter((x) => x.status === 'OPEN' && x.priority === p).length,
      color: PRIORITY_COLORS[p].dot,
    }))

    return { doneWeek, doneMonth, pomodoros, openCount, totalDone: doneTasks.length, days, byPriority }
  }, [tasks, lang, t])

  const tiles = [
    { label: t.doneWeek, value: stats.doneWeek, Icon: CalendarCheck2, color: BLUE },
    { label: t.doneMonth, value: stats.doneMonth, Icon: CheckCheck, color: GREEN },
    { label: t.totalDone, value: stats.totalDone, Icon: BarChart3, color: '#8a6bbf' },
    { label: t.totalPomodoros, value: stats.pomodoros, Icon: Timer, color: '#d99a2b' },
  ]

  const hasPriorityData = stats.byPriority.some((x) => x.value > 0)
  const hasDailyData = stats.days.some((x) => x.count > 0)

  return (
    <section className="overflow-hidden rounded-2xl border bg-white card-shadow" aria-label={t.stats}>
      <div className="flex items-center gap-2.5 border-b px-5 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8a6bbf] text-white">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 className="font-heading text-base font-bold text-[#3e525c]">{t.stats}</h2>
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* أرقام سريعة */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tiles.map(({ label, value, Icon, color }) => (
            <div key={label} className="rounded-xl border bg-muted/30 px-3 py-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color }} aria-hidden="true" />
                <span className="font-heading text-xl font-extrabold text-[#3e525c]">{value}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* الرسمان */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="mb-2 text-xs font-bold text-[#3e525c]">{t.completions7}</p>
            {hasDailyData ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.days} margin={{ top: 4, bottom: 0, start: 0, end: 0 }}>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64777f' }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64777f' }} width={28} />
                  <Tooltip
                    cursor={{ fill: 'rgba(37,130,177,0.06)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e3e9ee', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill={BLUE} radius={[6, 6, 0, 0]} maxBarSize={36} name={t.archiveTitle} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                {t.emptyArchive}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <p className="mb-2 text-xs font-bold text-[#3e525c]">{t.byPriority}</p>
            {hasPriorityData ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.byPriority.filter((x) => x.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {stats.byPriority
                        .filter((x) => x.value > 0)
                        .map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e3e9ee', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2 text-xs">
                  {stats.byPriority.map((x) => (
                    <li key={x.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} aria-hidden="true" />
                      <span className="text-muted-foreground">{x.name}</span>
                      <span className="font-bold text-[#3e525c]">{x.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                <ListTodo className="me-2 h-4 w-4" aria-hidden="true" />
                {t.openTasks}: 0
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
