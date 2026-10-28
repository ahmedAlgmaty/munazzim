'use client'

import { Providers } from '@/components/munazzim/providers'
import { Header } from '@/components/munazzim/header'
import { VisionCard } from '@/components/munazzim/vision-card'
import { GoalsSection } from '@/components/munazzim/goals'
import { TaskBoard } from '@/components/munazzim/task-board'
import { StatsCard } from '@/components/munazzim/stats'
import { ArchiveCard } from '@/components/munazzim/archive'
import { PomodoroWidget } from '@/components/munazzim/pomodoro'

// منظّم — اللوحة الواحدة: رؤيتي، أهدافي الكبرى، المهام، الإحصائيات، المنتهية
export default function Home() {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 pb-24 pt-6 sm:px-6">
          <VisionCard />
          <GoalsSection />
          <TaskBoard />
          <StatsCard />
          <ArchiveCard />
        </main>
        <footer className="mt-auto border-t bg-white/60 py-4 text-center text-xs text-muted-foreground">
          منظّم · رؤيتك أولاً، ثم مهامك يومًا بعد يوم
        </footer>
        <PomodoroWidget />
      </div>
    </Providers>
  )
}
