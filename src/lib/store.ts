'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Lang } from './types'

// مخزن اللغة — عربي افتراضياً، يُحفظ محلياً
interface LangStore {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'ar',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'munazzim-lang',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)

// مخزن بومودورو
export type PomodoroMode = 'work' | 'break'

interface PomodoroStore {
  mode: PomodoroMode
  secondsLeft: number
  running: boolean
  taskId: string | null
  workMin: number
  breakMin: number
  totalSeconds: number
  setDurations: (work: number, brk: number) => void
  setTask: (taskId: string | null) => void
  toggle: () => void
  reset: () => void
  switchMode: (mode: PomodoroMode) => void
  tick: () => void
}

export const usePomodoroStore = create<PomodoroStore>()((set, get) => ({
  mode: 'work',
  secondsLeft: 25 * 60,
  running: false,
  taskId: null,
  workMin: 25,
  breakMin: 5,
  totalSeconds: 25 * 60,
  setDurations: (work, brk) => {
    const { running, mode, workMin, breakMin } = get()
    if (running) return // لا نغيّر المدة أثناء جلسة جارية
    const mins = mode === 'work' ? work : brk
    const changed = work !== workMin || brk !== breakMin
    set({
      workMin: work,
      breakMin: brk,
      secondsLeft: changed ? mins * 60 : get().secondsLeft,
      totalSeconds: mins * 60,
    })
  },
  setTask: (taskId) => set({ taskId }),
  toggle: () => set((s) => ({ running: !s.running })),
  reset: () =>
    set((s) => ({
      running: false,
      mode: 'work',
      secondsLeft: s.workMin * 60,
      totalSeconds: s.workMin * 60,
    })),
  switchMode: (mode) => {
    const { workMin, breakMin } = get()
    const mins = mode === 'work' ? workMin : breakMin
    set({ mode, secondsLeft: mins * 60, totalSeconds: mins * 60, running: false })
  },
  tick: () => {
    const { secondsLeft, running } = get()
    if (!running) return
    if (secondsLeft <= 1) {
      set({ secondsLeft: 0, running: false })
    } else {
      set({ secondsLeft: secondsLeft - 1 })
    }
  },
}))
