'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/lib/use-t'
import { jsonFetch } from '@/lib/api'
import type { Goal, Priority, Scope, Task } from '@/lib/types'
import { PRIORITY_COLORS } from '@/lib/types'

export interface TaskDialogState {
  open: boolean
  task: Task | null // null → إضافة جديدة
  scope: Scope // نطاق مبدئي للإضافة السريعة
}

// حوار إضافة/تعديل مهمة — النموذج يُركَّب من جديد مع كل فتح (key) فلا نحتاج تأثيرات
export function TaskDialog({ state, onClose }: { state: TaskDialogState; onClose: () => void }) {
  const { lang } = useT()

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      {state.open && (
        <DialogContent className="sm:max-w-md" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <TaskForm
            key={state.task?.id ?? `new-${state.scope}`}
            task={state.task}
            initialScope={state.scope}
            onClose={onClose}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}

// النموذج الفعلي — حالة محلية تُهيأ من الخصائص مباشرة
function TaskForm({
  task,
  initialScope,
  onClose,
}: {
  task: Task | null
  initialScope: Scope
  onClose: () => void
}) {
  const { t } = useT()

  const qc = useQueryClient()
  const isEdit = task !== null

  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'MEDIUM')
  const [scope, setScope] = useState<Scope>(task?.scope ?? initialScope)
  const [goalId, setGoalId] = useState<string>(task?.goalId ?? 'none')

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => jsonFetch('/api/goals'),
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        title: title.trim(),
        notes: notes.trim() || null,
        priority,
        scope,
        goalId: goalId === 'none' ? null : goalId,
      }
      if (isEdit) {
        return jsonFetch(`/api/tasks/${task!.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      }
      return jsonFetch('/api/tasks', { method: 'POST', body: JSON.stringify(payload) })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['goals'] })
      onClose()
    },
  })

  const priorityBtn = (p: Priority, label: string) => {
    const c = PRIORITY_COLORS[p]
    const active = priority === p
    return (
      <button
        key={p}
        type="button"
        onClick={() => setPriority(p)}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition-all"
        style={
          active
            ? { background: c.soft, borderColor: c.dot, color: c.text }
            : { background: '#fff', borderColor: '#dbe3e9', color: '#64777f' }
        }
        aria-pressed={active}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: c.dot }} aria-hidden="true" />
        {label}
      </button>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-[#3e525c]">
          {isEdit ? t.editTask : t.newTask}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.taskTitlePh}
          autoFocus
          className="text-sm font-medium"
          aria-label={t.taskTitlePh}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) saveMut.mutate()
          }}
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPh}
          className="min-h-20 resize-y text-sm"
          aria-label={t.notes}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#3e525c]">{t.priority}</label>
          <div className="flex gap-2" role="group" aria-label={t.priority}>
            {priorityBtn('HIGH', t.high)}
            {priorityBtn('MEDIUM', t.medium)}
            {priorityBtn('LOW', t.low)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3e525c]">{t.scope}</label>
            <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">{t.scopeDay}</SelectItem>
                <SelectItem value="WEEK">{t.scopeWeek}</SelectItem>
                <SelectItem value="MONTH">{t.scopeMonth}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3e525c]">{t.linkGoal}</label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t.noGoal}</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t.cancel}
        </Button>
        <Button
          onClick={() => title.trim() && saveMut.mutate()}
          disabled={!title.trim() || saveMut.isPending}
          className="bg-[#2582b1] text-white hover:bg-[#1d6a92]"
        >
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.saveTask}
        </Button>
      </DialogFooter>
    </>
  )
}
