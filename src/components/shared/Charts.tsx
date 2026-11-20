import { formatCurrency } from '@/lib/format'

export function BarChart({ data }: { data: { month: string; count: number; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div role="img" aria-label="Volume de orçamentos por mês" className="flex h-52 items-end gap-4 pt-4">
      {data.map((d, i) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-2" title={`${d.count} orçamentos · ${formatCurrency(d.value)}`}>
          <span className="text-muted-foreground text-xs">{d.count}</span>
          <div
            className={i === data.length - 1 ? 'bg-primary w-full rounded-t-md' : 'bg-gold-soft/60 hover:bg-gold-soft w-full rounded-t-md transition-colors'}
            style={{ height: `${Math.max(2, (d.count / max) * 140)}px` }}
          />
          <span className="text-muted-foreground text-xs">{d.month}</span>
        </div>
      ))}
    </div>
  )
}
