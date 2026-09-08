import { useEffect, useState } from 'react'
import type { DataFile } from '@/types/data'

export function useData() {
  const [data, setData] = useState<DataFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<DataFile>
      })
      .then(setData)
      .catch((e) => setError(String(e)))
  }, [])

  return { data, error }
}
