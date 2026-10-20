import { useEffect, useState } from 'react'
import type { DataFile } from '@/types/data'

export function useData() {
  const [data, setData] = useState<DataFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 加时间戳参数绕过浏览器/CDN 缓存，保证每次打开拿到最新数据
    fetch(`${import.meta.env.BASE_URL}data.json?t=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<DataFile>
      })
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  return { data, error }
}
