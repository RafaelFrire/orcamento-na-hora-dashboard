import { useEffect, useState } from 'react'

/** Simula carregamento assíncrono dos mocks (estado de loading). */
export function useMockLoad(ms = import.meta.env.MODE === 'test' ? 0 : 450) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}
