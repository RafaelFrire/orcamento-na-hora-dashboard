import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError } from '@/services/api'

/** Mensagem amigável para qualquer erro. */
export function errorMessage(e: unknown) {
  return e instanceof ApiError ? e.message : 'Algo deu errado. Tente novamente.'
}

/**
 * Carrega dados assíncronos. Refaz a busca quando `deps` mudam e descarta
 * respostas de requisições antigas. `reload()` força nova busca.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settledKey, setSettledKey] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const seq = useRef(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // `loading` é derivado na hora do render: assim que as deps mudam, os dados
  // anteriores já contam como desatualizados (sem render intermediário "pronto").
  const key = JSON.stringify([...deps, tick])
  const loading = settledKey !== key

  useEffect(() => {
    const id = ++seq.current
    fetcherRef
      .current()
      .then((d) => {
        if (id !== seq.current) return
        setData(d)
        setError(null)
      })
      .catch((e) => {
        if (id === seq.current) setError(errorMessage(e))
      })
      .finally(() => {
        if (id === seq.current) setSettledKey(key)
      })
  }, [key])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { data, error, loading, reload }
}

/** Valor com atraso, para campos de busca que consultam a API. */
export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), import.meta.env.MODE === 'test' ? 0 : ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
