'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Target, Plus, CalendarDays, Trash2, CheckCircle2, Link2, Loader2, Trophy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useT } from '@/lib/use-t'
import { toast } from 'sonner'
import { jsonFetch } from '@/lib/api'
import type { Goal, Horizon } from '@/lib/types'

const HORIZON_STYLE: Record<Horizon, { bg: string; fg: string }> = {
  '1Y': { bg: '#e6f1f7', fg: '#1d6a92' },
  '3Y': { bg: '#efeaf7', fg: '#6a4e9c' },
  '5Y': { bg: '#fbf3e2', fg: '#9a6d13' },
}

export function GoalsSection() {
  const { t, lang } = useT()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [horizon, setHorizon] = useState<Horizon>('1Y')
  const [targetDate, setTargetDate] = useState('')

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => jsonFetch('/api/goals'),
  })

  const addMut = useMutation({
    mutationFn: () =>
      jsonFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({ title, horizon, targetDate: targetDate || null }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] })
      toast.success(t.goalAdded)
      setTitle('')
      setTargetDate('')
      setHorizon('1Y')
      setAddOpen(false)
    },
  })

  const horizonLabel = (h: Horizon) => (h === '1Y' ? t.h1Y : h === '3Y' ? t.h3Y : t.h5Y)

  return (
    <section aria-label={t.myGoals} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#488f5f] text-white">
            <Target className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-bold text-[#3e525c]">{t.myGoals}</h2>
            <p className="text-[11px] text-muted-foreground">{t.goalsSubtitle}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 bg-[#488f5f] text-white hover:bg-[#3a754d]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.addGoal}
        </Button>
      </div>

      {isLoading ? (
        <Card className="border-dashed">
          <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <Card className="border-dashed bg-[#f8fbf9]">
          <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t.noGoals}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} horizonLabel={horizonLabel(g.horizon)} />
          ))}
        </div>
      )}

      {/* حوار إضافة هدف */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="font-heading text-[#3e525c]">{t.addGoal}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#3e525c]" htmlFor="goal-title">
                {t.goalTitle}
              </label>
              <Input
                id="goal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.goalTitlePh}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) addMut.mutate()
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#3e525c]">{t.horizon}</label>
                <Select value={horizon} onValueChange={(v) => setHorizon(v as Horizon)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1Y">{t.h1Y}</SelectItem>
                    <SelectItem value="3Y">{t.h3Y}</SelectItem>
                    <SelectItem value="5Y">{t.h5Y}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#3e525c]" htmlFor="goal-date">
                  {t.targetDate}
                </label>
                <Input id="goal-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={() => title.trim() && addMut.mutate()}
              disabled={!title.trim() || addMut.isPending}
              className="bg-[#488f5f] text-white hover:bg-[#3a754d]"
            >
              {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

// بطاقة هدف واحد — مراحل + تقدم + ربط المهام
function GoalCard({ goal, horizonLabel }: { goal: Goal; horizonLabel: string }) {
  const { t, lang } = useT()
  const qc = useQueryClient()
  const [msDraft, setMsDraft] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['goals'] })

  const patchMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      jsonFetch(`/api/goals/${goal.id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  })
  const delMut = useMutation({
    mutationFn: () => jsonFetch(`/api/goals/${goal.id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
  const addMsMut = useMutation({
    mutationFn: (title: string) =>
      jsonFetch(`/api/goals/${goal.id}/milestones`, { method: 'POST', body: JSON.stringify({ title }) }),
    onSuccess: () => {
      invalidate()
      setMsDraft('')
    },
  })
  const patchMsMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      jsonFetch(`/api/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidate()
      if (Object.values(data)[0] === true) toast.success(t.milestoneDone)
    },
  })
  const delMsMut = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/milestones/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })

  const done = goal.milestones.filter((m) => m.done).length
  const total = goal.milestones.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const linked = goal.tasks.length

  const style = goal.achieved
    ? { bg: '#ecf4ee', fg: '#2e6b45' }
    : HORIZON_STYLE[goal.horizon] ?? HORIZON_STYLE['1Y']

  return (
    <Card
      className={`card-shadow transition-shadow hover:card-shadow-hover ${goal.achieved ? 'border-[#bcdcc6] bg-[#f8fcf9]' : ''}`}
    >
      <CardContent className="space-y-3 p-4">
        {/* الترويسة */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`font-heading text-sm font-bold leading-6 ${goal.achieved ? 'text-[#2e6b45] line-through decoration-[#8fc0a0]' : 'text-[#3e525c]'}`}
          >
            {goal.achieved && <Trophy className="mb-0.5 inline-block h-4 w-4 text-[#d99a2b]" aria-hidden="true" />}{' '}
            {goal.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: style.bg, color: style.fg }}>
              {horizonLabel}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-[#d64c4c]"
              onClick={() => setConfirmDel(true)}
              aria-label={t.delete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* التاريخ المستهدف + المهام المرتبطة */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {goal.targetDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3 text-[#2582b1]" aria-hidden="true" />
              {new Intl.DateTimeFormat(lang === 'ar' ? 'ar-LY' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                new Date(goal.targetDate)
              )}
            </span>
          )}
          {linked > 0 && (
            <Badge variant="secondary" className="gap-1 bg-[#e6f1f7] text-[10px] text-[#1d6a92]">
              <Link2 className="h-3 w-3" aria-hidden="true" />
              {linked} {linked === 1 ? t.linkedTasks : t.linkedTasksPl}
            </Badge>
          )}
        </div>

        {/* شريط التقدم */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-muted-foreground">{t.progress}</span>
            <span className="font-bold" style={{ color: goal.achieved ? '#2e6b45' : '#2582b1' }}>
              {goal.achieved ? '100%' : `${pct}%`}
            </span>
          </div>
          <Progress value={goal.achieved ? 100 : pct} className={goal.achieved ? '[&>div]:bg-[#488f5f]' : ''} />
        </div>

        {/* المراحل */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-[#3e525c]">{t.milestones}</p>
          {goal.milestones.map((m) => (
            <div key={m.id} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted/60">
              <Checkbox
                checked={m.done}
                onCheckedChange={(v) => patchMsMut.mutate({ id: m.id, data: { done: v === true } })}
                className={m.done ? 'border-[#488f5f] bg-[#488f5f] text-white' : 'border-[#b8c6cf]'}
                aria-label={m.title}
              />
              <span className={`flex-1 text-xs ${m.done ? 'text-muted-foreground line-through' : 'text-[#33424c]'}`}>
                {m.title}
              </span>
              <button
                type="button"
                onClick={() => delMsMut.mutate(m.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={t.delete}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-[#d64c4c]" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-0.5">
            <Input
              value={msDraft}
              onChange={(e) => setMsDraft(e.target.value)}
              placeholder={t.addMilestone}
              className="h-8 border-dashed text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && msDraft.trim()) addMsMut.mutate(msDraft.trim())
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 shrink-0 p-0 text-[#488f5f] hover:bg-[#ecf4ee]"
              onClick={() => msDraft.trim() && addMsMut.mutate(msDraft.trim())}
              aria-label={t.addMilestone}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* تحقيق الهدف */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => patchMut.mutate({ achieved: !goal.achieved })}
          className={`w-full gap-1.5 text-xs font-semibold ${goal.achieved ? 'border-[#cfe3d6] text-[#64777f]' : 'border-[#bcdcc6] bg-[#ecf4ee] text-[#2e6b45] hover:bg-[#dcebe1]'}`}
        >
          {goal.achieved ? <X className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {goal.achieved ? t.unmarkAchieved : t.markAchieved}
        </Button>
      </CardContent>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">{t.delete}</AlertDialogTitle>
            <AlertDialogDescription>{t.confirmDeleteGoal}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#d64c4c] text-white hover:bg-[#b83b3b]"
              onClick={() => delMut.mutate()}
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
