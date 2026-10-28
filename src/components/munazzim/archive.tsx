'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ChevronDown, RotateCcw, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
import { useT, formatDate } from '@/lib/use-t'
import { toast } from 'sonner'
import { jsonFetch } from '@/lib/api'
import type { Task } from '@/lib/types'

// قسم «منتهية» — أرشفة تلقائية للمهام المكتملة + استعادة
export function ArchiveCard() {
  const { t, lang } = useT()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => jsonFetch('/api/tasks'),
  })

  const done = useMemo(
    () =>
      tasks
        .filter((x) => x.status === 'DONE')
        .sort((a, b) => new Date(b.completedAt ?? b.updatedAt).getTime() - new Date(a.completedAt ?? a.updatedAt).getTime()),
    [tasks]
  )

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['goals'] })
  }

  const restoreMut = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'OPEN' }) }),
    onSuccess: () => {
      invalidate()
      toast.success(t.restored)
    },
  })

  const delMut = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast.success(t.taskDeleted)
      setDeleteId(null)
    },
  })

  const deletingTask = done.find((x) => x.id === deleteId)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section className="overflow-hidden rounded-2xl border bg-white card-shadow" aria-label={t.archiveTitle}>
        <div className="flex items-center justify-between gap-3 border-b border-[#dcebe1] bg-[#eff5f1] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#488f5f] text-white">
              <Archive className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-[#2e6b45]">{t.archiveTitle}</h2>
              <p className="text-[11px] text-[#5a8a6c]">
                {done.length} {t.archiveCount}
              </p>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#2e6b45] hover:bg-[#dcebe1]" aria-label={open ? t.close : t.archiveTitle}>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="max-h-96 space-y-2 overflow-y-auto px-4 py-4">
            {isLoading ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : done.length === 0 ? (
              <p className="rounded-xl border border-dashed bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
                {t.emptyArchive}
              </p>
            ) : (
              done.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e2eee6] bg-[#fafcfa] px-3 py-2.5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#488f5f] text-white" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-muted-foreground line-through decoration-[#9dbfa9]">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {task.completedAt ? formatDate(task.completedAt, lang) : ''}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {task.scope === 'DAY' ? t.scopeDay : task.scope === 'WEEK' ? t.scopeWeek : t.scopeMonth}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restoreMut.mutate(task.id)}
                    disabled={restoreMut.isPending}
                    className="h-7 gap-1 border-[#bcdcc6] px-2 text-[11px] font-bold text-[#2e6b45] hover:bg-[#ecf4ee]"
                    aria-label={t.restore}
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    {t.restore}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:bg-[#fdeaea] hover:text-[#d64c4c]"
                    onClick={() => setDeleteId(task.id)}
                    aria-label={t.deleteForever}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </section>

      {/* تأكيد الحذف النهائي */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">{t.deleteForever}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteTask}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#d64c4c] text-white hover:bg-[#b83b3b]"
              onClick={() => deleteId && delMut.mutate(deleteId)}
            >
              {t.deleteForever}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  )
}
