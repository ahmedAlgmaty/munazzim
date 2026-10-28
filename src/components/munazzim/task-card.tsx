'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  Pencil,
  Play,
  StickyNote,
  Timer,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useT } from '@/lib/use-t'
import { toast } from 'sonner'
import { jsonFetch } from '@/lib/api'
import type { Task } from '@/lib/types'
import { PRIORITY_COLORS } from '@/lib/types'
import { usePomodoroStore } from '@/lib/store'

// بطاقة المهمة — أولوية ملوّنة + ملاحظات + هدف مرتبط + بومودورو + إكمال
export function TaskCard({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const { t, lang } = useT()
  const qc = useQueryClient()
  const [showNotes, setShowNotes] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const setPomodoroTask = usePomodoroStore((s) => s.setTask)
  const pomoMode = usePomodoroStore((s) => s.mode)
  const pomoTaskId = usePomodoroStore((s) => s.taskId)
  const pomoRunning = usePomodoroStore((s) => s.running)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['goals'] })
  }

  const completeMut = useMutation({
    mutationFn: () => jsonFetch(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'DONE' }) }),
    onSuccess: () => {
      invalidate()
      toast.success(t.archived)
    },
  })

  const delMut = useMutation({
    mutationFn: () => jsonFetch(`/api/tasks/${task.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success(t.taskDeleted)
    },
  })

  const c = PRIORITY_COLORS[task.priority]
  const isRunningHere = pomoTaskId === task.id && pomoRunning

  return (
    <div
      className="group rounded-xl border bg-white p-3 card-shadow transition-all hover:card-shadow-hover"
      style={{ borderInlineStartWidth: 3, borderInlineStartColor: c.dot }}
    >
      <div className="flex items-start gap-2.5">
        {/* زر الإكمال — الأرشفة التلقائية */}
        <button
          type="button"
          onClick={() => !completeMut.isPending && completeMut.mutate()}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#b8c6cf] text-transparent transition-all hover:border-[#488f5f] hover:bg-[#ecf4ee] hover:text-[#488f5f]"
          aria-label={t.archiveTitle}
        >
          <Check className="h-3 w-3" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-6 text-[#33424c]">{task.title}</p>

          {/* الشارات: أولوية + هدف + بومودورو */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: c.soft, color: c.text }}
            >
              {task.priority === 'HIGH' ? t.high : task.priority === 'MEDIUM' ? t.medium : t.low}
            </span>
            {task.goal && (
              <span className="inline-flex max-w-40 items-center gap-1 truncate rounded-full bg-[#e6f1f7] px-2 py-0.5 text-[10px] font-semibold text-[#1d6a92]">
                <Link2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{task.goal.title}</span>
              </span>
            )}
            {task.pomodoros > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                <Timer className="h-2.5 w-2.5" aria-hidden="true" />
                {task.pomodoros}
              </span>
            )}
            {task.notes && task.notes.trim() && (
              <button
                type="button"
                onClick={() => setShowNotes((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-[#fbf3e2] px-2 py-0.5 text-[10px] font-bold text-[#9a6d13]"
                aria-expanded={showNotes}
              >
                <StickyNote className="h-2.5 w-2.5" aria-hidden="true" />
                {t.notes}
                {showNotes ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
            )}
          </div>

          {/* الملاحظات القابلة للطي */}
          {showNotes && task.notes && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#f7f9fa] px-3 py-2 text-xs leading-6 text-[#4f6470]">
              <FileText className="mt-1 h-3 w-3 shrink-0 text-[#8a9aa5]" aria-hidden="true" />
              <p className="whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}
        </div>

        {/* أدوات: بومودورو + تعديل + حذف */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 w-7 p-0 ${isRunningHere ? 'bg-[#e6f1f7] text-[#2582b1] opacity-100' : 'text-muted-foreground hover:bg-[#e6f1f7] hover:text-[#2582b1]'}`}
            onClick={() => {
              setPomodoroTask(task.id)
              if (pomoMode === 'break') usePomodoroStore.getState().switchMode('work')
              toast(`${t.pomodoroOnTask}: ${task.title}`, { icon: '⏱' })
            }}
            aria-label={t.pomodoroOnTask}
          >
            <Play className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:bg-[#e6f1f7] hover:text-[#2582b1]"
            onClick={() => onEdit(task)}
            aria-label={t.edit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:bg-[#fdeaea] hover:text-[#d64c4c]"
            onClick={() => setConfirmDel(true)}
            aria-label={t.delete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">{t.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteTask}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction className="bg-[#d64c4c] text-white hover:bg-[#b83b3b]" onClick={() => delMut.mutate()}>
              {t.deleteForever}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
