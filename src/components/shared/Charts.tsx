import { useState } from 'react'

import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StatsBucket } from '@/types'

export type ChartMetric = 'count' | 'value'

const SEGMENTS = [
  { key: 'won', label: 'Fechados', className: 'bg-success' },
  { key: 'pending', label: 'Em aberto', className: 'bg-primary' },
  { key: 'lost', label: 'Não fechados', className: 'bg-muted-foreground/35' },
] as const

const PLOT_HEIGHT = 176
/** Altura aproximada do tooltip, para limitá-lo à área do gráfico. */
const TIP_HEIGHT = 120

function parts(b: StatsBucket, metric: ChartMetric) {
  return metric === 'count'
    ? { won: b.wonCount, pending: b.pendingCount, lost: b.lostCount }
    : { won: b.wonValue, pending: b.pendingValue, lost: b.lostValue }
}

const fmt = (n: number, metric: ChartMetric) => (metric === 'count' ? String(n) : formatCurrency(n))
/** Eixo Y compacto: 1.500 -> "1,5 mil". */
const axis = (n: number, metric: ChartMetric) =>
  metric === 'count' || n < 1000 ? String(Math.round(n)) : `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`

/** Teto "redondo" do eixo (1, 2, 5 × 10ⁿ) para as linhas de grade ficarem limpas. */
function niceMax(v: number) {
  if (v <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(v))
  const n = v / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow
}

/** Barras empilhadas por resultado (fechado / em aberto / não fechado), um balde por barra. */
export function EvolutionChart({ data, metric, ariaLabel }: { data: StatsBucket[]; metric: ChartMetric; ariaLabel: string }) {
  const [active, setActive] = useState<number | null>(null)
  const totalOf = (b: StatsBucket) => (metric === 'count' ? b.count : b.value)
  const max = niceMax(Math.max(0, ...data.map(totalOf)))
  const step = Math.ceil(data.length / 8)
  const ticks = [1, 0.5, 0]
  const empty = data.every((b) => totalOf(b) === 0)

  const tip = active !== null ? data[active] : null
  const tipAlign = active === null ? '' : active < data.length * 0.2 ? 'left-0' : active > data.length * 0.8 ? 'right-0' : '-translate-x-1/2'
  // Fica logo acima da barra, mas sempre dentro da área do gráfico (não cobre o cabeçalho do card).
  const tipBottom = tip ? Math.min(Math.max(0, (totalOf(tip) / max) * PLOT_HEIGHT) + 8, PLOT_HEIGHT - TIP_HEIGHT) : 0

  return (
    <div>
      <div className="mt-4 flex gap-3">
        <div className="text-muted-foreground flex flex-col justify-between pb-0.5 text-right text-[11px]" style={{ height: PLOT_HEIGHT }} aria-hidden>
          {ticks.map((t) => (
            <span key={t}>{axis(max * t, metric)}</span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: PLOT_HEIGHT }} aria-hidden>
            {ticks.map((t) => (
              <div key={t} className={cn('border-t', t === 0 ? 'border-border' : 'border-border/60 border-dashed')} />
            ))}
          </div>

          <div role="img" aria-label={ariaLabel} className="relative flex items-end gap-[3px]" style={{ height: PLOT_HEIGHT }} onMouseLeave={() => setActive(null)}>
            {data.map((b, i) => {
              const total = totalOf(b)
              const p = parts(b, metric)
              const h = total ? Math.max(3, (total / max) * PLOT_HEIGHT) : 0
              return (
                <div
                  key={b.key}
                  data-testid="bar"
                  className="flex h-full flex-1 flex-col justify-end"
                  onMouseEnter={() => setActive(i)}
                  title={`${b.label}: ${b.count} orçamentos · ${formatCurrency(b.value)}`}
                >
                  <div className={cn('flex flex-col-reverse overflow-hidden rounded-t-[3px] transition-opacity', active !== null && active !== i && 'opacity-50')} style={{ height: h }}>
                    {SEGMENTS.map((s) => {
                      const v = p[s.key]
                      return v ? <div key={s.key} className={s.className} style={{ height: `${(v / total) * 100}%` }} /> : null
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-2 flex gap-[3px]" aria-hidden>
            {data.map((b, i) => (
              <span key={b.key} className="text-muted-foreground min-w-0 flex-1 text-center text-[11px]">
                {i % step === 0 ? b.label : ''}
              </span>
            ))}
          </div>

          {tip && (
            <div
              role="tooltip"
              className={cn('bg-popover text-popover-foreground pointer-events-none absolute z-10 w-48 rounded-lg border p-3 text-xs shadow-lg', tipAlign)}
              style={{ bottom: tipBottom + 22, ...(active !== null && tipAlign === '-translate-x-1/2' ? { left: `${((active + 0.5) / data.length) * 100}%` } : {}) }}
            >
              <p className="mb-1.5 font-semibold">{tip.label}</p>
              <p className="text-muted-foreground mb-1.5">
                {tip.count} orçamento{tip.count === 1 ? '' : 's'} · {formatCurrency(tip.value)}
              </p>
              {SEGMENTS.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className={cn('size-2 rounded-full', s.className)} />{s.label}</span>
                  <span className="font-medium">{fmt(parts(tip, metric)[s.key], metric)}</span>
                </p>
              ))}
              {tip.canceledCount > 0 && <p className="text-destructive mt-1.5">{tip.canceledCount} cancelado{tip.canceledCount === 1 ? '' : 's'} (fora do gráfico)</p>}
            </div>
          )}

          {empty && (
            <p className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm">
              Nenhum orçamento neste período
            </p>
          )}
        </div>
      </div>

      <ul className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5"><span className={cn('size-2.5 rounded-sm', s.className)} />{s.label}</li>
        ))}
      </ul>
    </div>
  )
}

/** Barras horizontais proporcionais (ex.: cancelamentos por categoria). */
export function HorizontalBars({ rows, barClassName = 'bg-destructive/70' }: { rows: { label: string; count: number; hint?: string }[]; barClassName?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="text-muted-foreground">{r.count}{r.hint ? ` · ${r.hint}` : ''}</span>
          </div>
          <div className="bg-secondary h-2 overflow-hidden rounded-full">
            <div className={cn('h-full rounded-full', barClassName)} style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
