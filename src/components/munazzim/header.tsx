'use client'

import { useState } from 'react'
import { CalendarDays, Languages, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/use-t'
import { useLangStore } from '@/lib/store'
import { jsonFetch } from '@/lib/api'

export function Header() {
  const { lang, t } = useT()
  const setLang = useLangStore((s) => s.setLang)

  // يُحسب في كل عرض — يتجدد مع تغيير اللغة، وتُتجاهل أي تعارض ترطيب
  const dateStr = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-LY' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  function toggleLang() {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    // مزامنة اللغة مع قاعدة البيانات
    jsonFetch('/api/settings', { method: 'PUT', body: JSON.stringify({ language: next }) }).catch(() => {})
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #2582b1 0%, #1d6a92 100%)' }}
            aria-hidden="true"
          >
            <ListChecks className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-bold leading-tight text-[#3e525c]">{t.appName}</h1>
            <p className="hidden sm:block truncate text-xs text-muted-foreground">{t.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-[#2582b1]" aria-hidden="true" />
            <span suppressHydrationWarning>{dateStr}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLang}
            className="gap-1.5 rounded-full font-semibold"
            aria-label={t.language}
          >
            <Languages className="h-4 w-4 text-[#2582b1]" aria-hidden="true" />
            {t.language}
          </Button>
        </div>
      </div>
    </header>
  )
}
