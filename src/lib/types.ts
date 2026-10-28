// الأنواع المشتركة لبرنامج منظّم
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type Scope = 'DAY' | 'WEEK' | 'MONTH'
export type Status = 'OPEN' | 'DONE'
export type Horizon = '1Y' | '3Y' | '5Y'
export type Lang = 'ar' | 'en'

export interface TaskGoal {
  id: string
  title: string
}

export interface Task {
  id: string
  title: string
  notes: string | null
  priority: Priority
  scope: Scope
  status: Status
  completedAt: string | null
  pomodoros: number
  goalId: string | null
  goal: TaskGoal | null
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  title: string
  done: boolean
  order: number
  goalId: string
}

export interface Goal {
  id: string
  title: string
  horizon: Horizon
  targetDate: string | null
  achieved: boolean
  createdAt: string
  updatedAt: string
  milestones: Milestone[]
  tasks: { id: string }[]
}

export interface Vision {
  id: string
  body: string
  updatedAt: string
}

export interface Settings {
  id: string
  language: Lang
  pomodoroWork: number
  pomodoroBreak: number
}

// ألوان الأولويات — هوية منظّم
export const PRIORITY_COLORS: Record<Priority, { dot: string; soft: string; text: string }> = {
  HIGH: { dot: '#e05656', soft: '#fdeaea', text: '#b83b3b' },
  MEDIUM: { dot: '#d99a2b', soft: '#fbf3e2', text: '#9a6d13' },
  LOW: { dot: '#6b7f8a', soft: '#eef2f4', text: '#4f6470' },
}

export const SCOPE_COLORS: Record<Scope, string> = {
  DAY: '#2582b1',
  WEEK: '#5a9e6f',
  MONTH: '#8a6bbf',
}

export const BLUE = '#2582b1'
export const GREEN = '#488f5f'
