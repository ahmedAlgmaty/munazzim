'use client'

import { useRef, useState } from 'react'
import { CalendarDays, Download, Languages, ListChecks, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/use-t'
import { useLangStore } from '@/lib/store'
import { jsonFetch } from '@/lib/api'

export function Header() {
  const { lang, t } = useT()
  const setLang = useLangStore((s) => s.setLang)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

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

  // تنزيل نسخة احتياطية كاملة (JSON)
  async function exportBackup() {
    try {
      setBusy(true)
      const res = await fetch('/api/backup', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `munazzim-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(lang === 'ar' ? 'تم تنزيل النسخة الاحتياطية ✓' : 'Backup downloaded ✓')
    } catch {
      toast.error(lang === 'ar' ? 'تعذّر إنشاء النسخة الاحتياطية' : 'Backup failed')
    } finally {
      setBusy(false)
    }
  }

  // استعادة من ملف نسخة احتياطية (دمج بدون حذف)
  async function importBackup(file: File) {
    const okToGo = window.confirm(
      lang === 'ar'
        ? 'سيتم دمج بيانات الملف مع بياناتك الحالية (لا يُحذف شيء). متابعة؟'
        : 'Data from the file will be merged into your current data (nothing is deleted). Continue?'
    )
    if (!okToGo) return
    try {
      setBusy(true)
      const text = await file.text()
      const data: unknown = JSON.parse(text)
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('failed')
      const j = (await res.json()) as { restored?: Record<string, number> }
      const r = j.restored ?? {}
      toast.success(
        lang === 'ar'
          ? `تمت الاستعادة ✓ (${r.tasks ?? 0} مهمة، ${r.goals ?? 0} هدف)`
          : `Restored ✓ (${r.tasks ?? 0} tasks, ${r.goals ?? 0} goals)`
      )
      setTimeout(() => window.location.reload(), 1200)
    } catch {
      toast.error(lang === 'ar' ? 'ملف غير صالح أو فشل الاستيراد' : 'Invalid file or import failed')
    } finally {
      setBusy(false)
    }
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
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importBackup(f)
              e.target.value = ''
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={exportBackup}
            disabled={busy}
            className="gap-1.5 rounded-full font-semibold"
            aria-label={lang === 'ar' ? 'تنزيل نسخة احتياطية' : 'Download backup'}
          >
            <Download className="h-4 w-4 text-[#2582b1]" aria-hidden="true" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'نسخ احتياطي' : 'Backup'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="gap-1.5 rounded-full font-semibold"
            aria-label={lang === 'ar' ? 'استعادة نسخة احتياطية' : 'Restore backup'}
          >
            <Upload className="h-4 w-4 text-[#2582b1]" aria-hidden="true" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'استعادة' : 'Restore'}</span>
          </Button>
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
