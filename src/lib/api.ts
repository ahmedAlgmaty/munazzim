// أدوات الاتصال بالـ API
export async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...init,
  })
  if (!res.ok) {
    let msg = `${res.status}`
    try {
      const j = await res.json()
      msg = j.error ?? msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json()
}
