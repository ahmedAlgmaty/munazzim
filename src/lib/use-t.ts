'use client'

import { useLangStore } from './store'
import { getDict } from './i18n'
import type { Lang } from './types'

// خطاف اللغة والقاموس — يُستخدم في كل مكونات منظّم
export function useT() {
  const lang = useLangStore((s) => s.lang)
  const t = getDict(lang)
  const dir: 'rtl' | 'ltr' = lang === 'ar' ? 'rtl' : 'ltr'
  return { lang, t, dir }
}

export function formatDate(d: string | Date, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-LY' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(date)
}
