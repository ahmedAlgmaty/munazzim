'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLangStore } from '@/lib/store'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 3000, refetchOnWindowFocus: false, retry: 1 },
        },
      })
  )

  // استعادة اللغة المحفوظة بعد الترطيب لتجنب تعارض SSR
  useEffect(() => {
    useLangStore.persist.rehydrate()
  }, [])

  // مزامنة اتجاه ولسان الصفحة
  const lang = useLangStore((s) => s.lang)
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
