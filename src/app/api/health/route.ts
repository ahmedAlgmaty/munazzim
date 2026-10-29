import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.DATABASE_URL ?? ''
  const token = process.env.DATABASE_AUTH_TOKEN ?? ''
  let ok = false
  let error: string | null = null
  try {
    await db.setting.count()
    ok = true
  } catch (e) {
    error = (e as Error).message.slice(0, 200)
  }
  return NextResponse.json({
    ok,
    mode: url.startsWith('libsql://') ? 'turso' : 'local-file',
    urlSet: url.length > 0,
    tokenSet: token.length > 0,
    error,
    fix: ok
      ? 'كل شيء يعمل ✅'
      : !url.startsWith('libsql://')
        ? 'DATABASE_URL غير مضبوط في Vercel أو لا يبدأ بـ libsql://'
        : !token
          ? 'DATABASE_AUTH_TOKEN مفقود في Vercel'
          : 'راجع صحة الرابط والتوكن في Vercel ثم Redeploy',
  })
}
