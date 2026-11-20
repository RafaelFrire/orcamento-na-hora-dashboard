import { formatCurrency } from '@/lib/format'

export function BarChart({ data }: { data: { month: string; count: number; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.count))
  return (
    <div role="img" aria-label="Volume de orçamentos por mês" className="flex h-52 items-end gap-4 pt-4">
      {data.map((d, i) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-2" title={`${d.count} orçamentos · ${formatCurrency(d.value)}`}>
          <span className="text-muted-foreground text-xs">{d.count}</span>
          <div
            className={i === data.length - 1 ? 'bg-primary w-full rounded-t-md' : 'bg-gold-soft/60 hover:bg-gold-soft w-full rounded-t-md transition-colors'}
            style={{ height: `${(d.count / max) * 140}px` }}
          />
          <span className="text-muted-foreground text-xs">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

export function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  const r = 52
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 140 140" className="size-36 -rotate-90" role="img" aria-label="Distribuição por status">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#efefed" strokeWidth="16" />
        {total > 0 &&
          slices.map((s) => {
            const len = (s.value / total) * c
            const el = (
              <circle
                key={s.label}
                cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
      </svg>
      <ul className="space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground w-20">{s.label}</span>
            <span className="font-medium">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
