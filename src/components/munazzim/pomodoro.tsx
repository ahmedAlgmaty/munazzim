'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pause, Play, RotateCcw, SkipForward, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { usePomodoroStore } from '@/lib/store'
import type { Task, Settings } from '@/lib/types'
import { BLUE, GREEN } from '@/lib/types'

// تنبيه صوتي خفيف عبر Web Audio
function beep(times = 2) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      const t0 = ctx.currentTime + i * 0.35
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28)
      osc.start(t0)
      osc.stop(t0 + 0.3)
    }
  } catch {
    /* الصوت غير متاح */
  }
}

export function mmss(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const R = 52
const CIRC = 2 * Math.PI * R

// أداة بومودورو العائمة — جلسات عمل/استراحة مرتبطة بالمهام
export function PomodoroWidget() {
  const { t, lang } = useT()
  const qc = useQueryClient()
  const secondsLeft = usePomodoroStore((s) => s.secondsLeft)
  const running = usePomodoroStore((s) => s.running)
  const mode = usePomodoroStore((s) => s.mode)
  const tick = usePomodoroStore((s) => s.tick)

  const completeRef = useRef(false)
  const handleComplete = useCallback(() => {
    if (completeRef.current) return
    completeRef.current = true
    setTimeout(() => (completeRef.current = false), 600)

    beep()
    const st = usePomodoroStore.getState()
    if (st.mode === 'work') {
      toast.success(t.workDone)
      if (st.taskId) {
        jsonFetch(`/api/tasks/${st.taskId}`, { method: 'PATCH', body: JSON.stringify({ pomodoroInc: 1 }) })
          .then(() => qc.invalidateQueries({ queryKey: ['tasks'] }))
          .catch(() => {})
      }
      st.switchMode('break')
      // ابدأ الاستراحة تلقائياً
      setTimeout(() => {
        const s2 = usePomodoroStore.getState()
        if (s2.mode === 'break' && !s2.running) s2.toggle()
      }, 400)
    } else {
      toast.success(t.breakDone)
      st.switchMode('work')
    }
  }, [t.workDone, t.breakDone, qc])

  // محرك العدّاد
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [running, tick])

  // إتمام الجلسة عند الوصول إلى الصفر
  useEffect(() => {
    if (secondsLeft === 0 && !running) {
      handleComplete()
    }
  }, [secondsLeft, running, handleComplete])

  const bg = mode === 'work' ? 'linear-gradient(135deg,#2582b1,#1d6a92)' : 'linear-gradient(135deg,#488f5f,#3a754d)'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t.pomodoro}
          className="fixed bottom-5 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: bg, insetInlineEnd: '1.25rem' }}
        >
          <Timer className="h-5 w-5" aria-hidden="true" />
          <span className="font-mono text-sm font-bold tabular-nums">{mmss(secondsLeft)}</span>
          {running && (
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className="w-80 rounded-2xl border p-4 card-shadow"
      >
        <PomodoroPanel />
      </PopoverContent>
    </Popover>
  )
}

// لوحة التحكم الكاملة — تُعرض داخل الـ Popover
function PomodoroPanel() {
  const { t, lang } = useT()
  const qc = useQueryClient()

  const {
    mode,
    secondsLeft,
    totalSeconds,
    running,
    taskId,
    workMin,
    breakMin,
    toggle,
    reset,
    switchMode,
    setDurations,
    setTask,
  } = usePomodoroStore()

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => jsonFetch('/api/tasks'),
  })
  const openTasks = tasks.filter((x) => x.status === 'OPEN')

  const saveDurations = useMutation({
    mutationFn: (data: { pomodoroWork?: number; pomodoroBreak?: number }) =>
      jsonFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  const color = mode === 'work' ? BLUE : GREEN
  const pct = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const minLabel = lang === 'ar' ? '(دقيقة)' : '(min)'

  return (
    <div className="space-y-4">
      {/* الوضع + تصفير */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-full bg-muted p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => switchMode('work')}
            className={`rounded-full px-3 py-1 transition-colors ${mode === 'work' ? 'bg-white text-[#2582b1] shadow-sm' : 'text-muted-foreground'}`}
            aria-pressed={mode === 'work'}
          >
            {t.work}
          </button>
          <button
            type="button"
            onClick={() => switchMode('break')}
            className={`rounded-full px-3 py-1 transition-colors ${mode === 'break' ? 'bg-white text-[#2e6b45] shadow-sm' : 'text-muted-foreground'}`}
            aria-pressed={mode === 'break'}
          >
            {t.breakMode}
          </button>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-muted-foreground transition-colors hover:text-[#3e525c]"
          aria-label={t.reset}
          title={t.reset}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* القرص الدائري */}
      <div className="flex justify-center">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#eef2f5" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct)}
              className="transition-[stroke-dashoffset] duration-700 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-extrabold tabular-nums text-[#3e525c]">{mmss(secondsLeft)}</span>
            <span className="text-[10px] font-bold" style={{ color }}>
              {mode === 'work' ? t.work : t.breakMode}
            </span>
          </div>
        </div>
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={toggle}
          className="h-10 w-24 gap-1.5 rounded-full text-white"
          style={{ background: mode === 'work' ? BLUE : GREEN }}
          aria-label={running ? t.pause : t.start}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? t.pause : t.start}
        </Button>
        <Button
          variant="outline"
          className="h-10 w-10 rounded-full p-0"
          onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}
          aria-label={t.skip}
          title={t.skip}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* المهمة المرتبطة */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-[#3e525c]">{t.sessionFor}</label>
        <Select value={taskId ?? 'none'} onValueChange={(v) => setTask(v === 'none' ? null : v)}>
          <SelectTrigger className="h-9 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t.noTask}</SelectItem>
            {openTasks.map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ضبط المدد */}
      <div className="grid grid-cols-2 gap-3 border-t pt-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground" htmlFor="pomo-work">
            {t.work} {minLabel}
          </label>
          <input
            id="pomo-work"
            type="number"
            min={5}
            max={90}
            defaultValue={workMin}
            key={`work-${workMin}`}
            onBlur={(e) => {
              const v = Math.min(90, Math.max(5, Number(e.target.value) || 25))
              e.target.value = String(v)
              setDurations(v, breakMin)
              saveDurations.mutate({ pomodoroWork: v })
            }}
            className="h-8 w-full rounded-lg border bg-white px-2 text-center text-xs font-bold text-[#3e525c]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground" htmlFor="pomo-break">
            {t.breakMode} {minLabel}
          </label>
          <input
            id="pomo-break"
            type="number"
            min={1}
            max={30}
            defaultValue={breakMin}
            key={`break-${breakMin}`}
            onBlur={(e) => {
              const v = Math.min(30, Math.max(1, Number(e.target.value) || 5))
              e.target.value = String(v)
              setDurations(workMin, v)
              saveDurations.mutate({ pomodoroBreak: v })
            }}
            className="h-8 w-full rounded-lg border bg-white px-2 text-center text-xs font-bold text-[#3e525c]"
          />
        </div>
      </div>
    </div>
  )
}
