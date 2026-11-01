import { PrismaClient } from '@prisma/client'
import { createClient, type Client } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

/**
 * طبقة قاعدة البيانات في منظّم — تعمل تلقائيًا في الحالتين:
 *
 * 1) محليًا: SQLite في ملف db/custom.db (كما هي، بدون أي إعداد).
 * 2) على Vercel/Turso: إذا كان DATABASE_URL يبدأ بـ libsql://
 *    يتصل مباشرة بقاعدة Turso باستخدام DATABASE_AUTH_TOKEN.
 *
 * في الحالتين تُنشأ الجداول تلقائيًا عند أول طلب (CREATE TABLE IF NOT EXISTS)
 * حتى لا تحتاج لأي خطوة يدوية بعد النشر.
 */

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'file:../db/custom.db'

const isTurso = DATABASE_URL.startsWith('libsql://')

// مخطط الجداول — مولَّد من prisma/schema.prisma
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "scope" TEXT NOT NULL DEFAULT 'DAY',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "completedAt" DATETIME,
    "pomodoros" INTEGER NOT NULL DEFAULT 0,
    "goalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Vision" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "body" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "horizon" TEXT NOT NULL DEFAULT '1Y',
    "targetDate" DATETIME,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "goalId" TEXT NOT NULL,
    CONSTRAINT "Milestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "language" TEXT NOT NULL DEFAULT 'ar',
    "pomodoroWork" INTEGER NOT NULL DEFAULT 25,
    "pomodoroBreak" INTEGER NOT NULL DEFAULT 5
);
`

type DbClient = PrismaClient

const globalForDb = globalThis as unknown as {
  __munazzimDb?: DbClient
  __munazzimReady?: Promise<void>
}

function createDb(): { db: DbClient; ready: Promise<void> } {
  if (isTurso) {
    // ---- وضع Turso (النشر السحابي على Vercel) ----
    // 1) اتصال مستقل لإنشاء الجداول تلقائيًا عند أول تشغيل
    const libsql: Client = createClient({
      url: DATABASE_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    // 2) محوّل PrismaLibSQL (في 6.19+ يأخذ كائن الإعدادات مباشرة)
    const adapter = new PrismaLibSQL({
      url: DATABASE_URL,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    const base = new PrismaClient({ adapter })
    const ready = libsql.executeMultiple(SCHEMA_SQL)
    const db = base.$extends({
      query: {
        $allOperations({ args, query }) {
          // لا يمرّ أي استعلام قبل اكتمال إنشاء الجداول
          return ready.then(() => query(args))
        },
      },
    }) as unknown as DbClient
    return { db, ready }
  }

  // ---- وضع الملف المحلي (SQLite) ----
  const base = new PrismaClient()
  const ready = (async () => {
    const statements = SCHEMA_SQL.split(';')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const statement of statements) {
      await base.$executeRawUnsafe(statement)
    }
  })()
  const db = base.$extends({
    query: {
      $allOperations({ args, query }) {
        return ready.then(() => query(args))
      },
    },
  }) as unknown as DbClient
  return { db, ready }
}

const created = createDb()

export const db: DbClient = globalForDb.__munazzimDb ?? created.db
export const dbReady: Promise<void> =
  globalForDb.__munazzimReady ?? created.ready

globalForDb.__munazzimDb = db
globalForDb.__munazzimReady = dbReady
