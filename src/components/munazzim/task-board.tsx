'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CalendarRange, CalendarCheck, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useT } from '@/lib/use-t'
import { toast } from 'sonner'
import { jsonFetch } from '@/lib/api'
import type { Scope, Task } from '@/lib/types'
import { TaskCard } from './task-card'
import { TaskDialog, type TaskDialogState } from './task-dialog'

const SCOPE_META: Record<Scope, { color: string }> = {
  DAY: { color: '#2582b1' },
  WEEK: { color: '#5a9e6f' },
  MONTH: { color: '#8a6bbf' },
}

// لوحة المهام — ثلاثة أعمدة: اليوم / هذا الأسبوع / هذا الشهر
export function TaskBoard() {
  const { t } = useT()
  const [dialog, setDialog] = useState<TaskDialogState>({ open: false, task: null, scope: 'DAY' })

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => jsonFetch('/api/tasks'),
  })

  const open = useMemo(() => tasks.filter((x) => x.status === 'OPEN'), [tasks])
  const byScope = (s: Scope) => open.filter((x) => x.scope === s)

  const columns: { scope: Scope; title: string; empty: string; Icon: typeof CalendarDays }[] = [
    { scope: 'DAY', title: t.todayCol, empty: t.emptyToday, Icon: CalendarDays },
    { scope: 'WEEK', title: t.weekCol, empty: t.emptyWeek, Icon: CalendarRange },
    { scope: 'MONTH', title: t.monthCol, empty: t.emptyMonth, Icon: CalendarCheck },
  ]

  return (
    <section aria-label={t.todayCol} className="space-y-3">
      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border bg-white text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-[#2582b1]" aria-hidden="true" />
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-3">
          {columns.map(({ scope, title, empty, Icon }) => (
            <TaskColumn
              key={scope}
              scope={scope}
              title={title}
              empty={empty}
              Icon={Icon}
              tasks={byScope(scope)}
              onAdd={() => setDialog({ open: true, task: null, scope })}
              onEdit={(task) => setDialog({ open: true, task, scope: task.scope })}
            />
          ))}
        </div>
      )}

      <TaskDialog state={dialog} onClose={() => setDialog({ open: false, task: null, scope: 'DAY' })} />
    </section>
  )
}

// عمود واحد — ترويسة ملونة + إضافة سريعة + قائمة المهام
function TaskColumn({
  scope,
  title,
  empty,
  Icon,
  tasks,
  onAdd,
  onEdit,
}: {
  scope: Scope
  title: string
  empty: string
  Icon: typeof CalendarDays
  tasks: Task[]
  onAdd: () => void
  onEdit: (t: Task) => void
}) {
  const { t } = useT()
  const qc = useQueryClient()
  const [quick, setQuick] = useState('')
  const color = SCOPE_META[scope].color

  const quickAddMut = useMutation({
    mutationFn: (title: string) =>
      jsonFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ title, scope }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(t.taskAdded)
      setQuick('')
    },
  })

  return (
    <div className="overflow-hidden rounded-2xl border bg-white card-shadow">
      {/* ترويسة العمود */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ background: `${color}0d` }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: color }}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h3 className="font-heading text-sm font-bold text-[#3e525c]">{title}</h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{ background: `${color}1a`, color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* إضافة سريعة */}
      <div className="flex items-center gap-1.5 px-3 pt-3">
        <Input
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder={t.addTask}
          className="h-9 border-dashed bg-transparent text-xs"
          aria-label={t.addTask}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && quick.trim()) quickAddMut.mutate(quick.trim())
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-9 w-9 shrink-0 p-0 hover:bg-[#e6f1f7]"
          style={{ color }}
          onClick={() => quick.trim() && quickAddMut.mutate(quick.trim())}
          disabled={quickAddMut.isPending}
          aria-label={t.add}
        >
          {quickAddMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* القائمة */}
      <div className="max-h-[26rem] space-y-2 overflow-y-auto px-3 py-3" role="list">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
            {empty}
          </p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} onEdit={onEdit} />)
        )}
      </div>
    </div>
  )
}
