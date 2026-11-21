import { Hammer, Snowflake } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ErrorNotice } from '@/components/shared/Pager'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { errorMessage, useApi } from '@/hooks/useApi'
import { formatCurrency, toPriceString, unitLabel } from '@/lib/format'
import { catalogService, type TemplatePackItem, type TemplatePackSummary } from '@/services/catalog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado depois de importar, para recarregar a listagem. */
  onImported: () => void
  /** Modelo do segmento da empresa: abre direto nele. */
  preferredKey?: string | null
}

export function ImportTemplateModal({ open, onOpenChange, onImported, preferredKey }: Props) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-3xl"
      title="Modelos de catálogo"
      description="Comece com serviços e peças prontos do seu nicho e ajuste os preços antes de importar."
    >
      {open && <Content onClose={() => onOpenChange(false)} onImported={onImported} preferredKey={preferredKey} />}
    </Modal>
  )
}

function Content({ onClose, onImported, preferredKey }: { onClose: () => void; onImported: () => void; preferredKey?: string | null }) {
  const packs = useApi(() => catalogService.templates(), [])
  const [chosen, setChosen] = useState<string | null>(null)

  if (packs.error) return <ErrorNotice message={packs.error} onRetry={packs.reload} />
  if (!packs.data) return <p className="text-muted-foreground py-8 text-center text-sm">Carregando modelos…</p>
  if (packs.data.length === 0) return <p className="text-muted-foreground py-8 text-center text-sm">Nenhum modelo disponível.</p>

  const preferred = packs.data.find((p) => p.key === preferredKey)?.key
  const key = chosen ?? preferred ?? (packs.data.length === 1 ? packs.data[0].key : null)
  if (!key) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {packs.data.map((p) => (
          <PackCard key={p.key} pack={p} onChoose={() => setChosen(p.key)} />
        ))}
      </div>
    )
  }
  return <PackEditor packKey={key} onBack={packs.data.length > 1 ? () => setChosen(null) : undefined} onClose={onClose} onImported={onImported} />
}

function PackCard({ pack, onChoose }: { pack: TemplatePackSummary; onChoose: () => void }) {
  return (
    <button type="button" onClick={onChoose} className="hover:border-primary hover:bg-accent/40 flex items-start gap-3 rounded-lg border p-4 text-left transition-colors">
      {pack.key === 'marcenaria' ? <Hammer className="text-primary mt-0.5 size-5 shrink-0" /> : <Snowflake className="text-primary mt-0.5 size-5 shrink-0" />}
      <span>
        <span className="block font-medium">{pack.name}</span>
        <span className="text-muted-foreground block text-sm">{pack.description}</span>
        <span className="text-muted-foreground mt-1 block text-xs">{pack.itemCount} itens</span>
      </span>
    </button>
  )
}

interface Row {
  checked: boolean
  price: string
}

function PackEditor({ packKey, onBack, onClose, onImported }: { packKey: string; onBack?: () => void; onClose: () => void; onImported: () => void }) {
  const toast = useToast()
  const pack = useApi(() => catalogService.template(packKey), [packKey])
  const [rows, setRows] = useState<Record<string, Row>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const items = pack.data?.items
  const groups = useMemo(() => {
    const map = new Map<string, TemplatePackItem[]>()
    for (const item of items ?? []) map.set(item.category, [...(map.get(item.category) ?? []), item])
    return [...map]
  }, [items])

  if (pack.error) return <ErrorNotice message={pack.error} onRetry={pack.reload} />
  if (!pack.data) return <p className="text-muted-foreground py-8 text-center text-sm">Carregando itens…</p>

  const row = (i: TemplatePackItem): Row => rows[i.key] ?? { checked: true, price: i.price.replace('.', ',') }
  const patch = (i: TemplatePackItem, change: Partial<Row>) => setRows((r) => ({ ...r, [i.key]: { ...row(i), ...change } }))
  const all = pack.data.items
  const selected = all.filter((i) => row(i).checked)

  function setMany(list: TemplatePackItem[], checked: boolean) {
    setRows((r) => ({ ...r, ...Object.fromEntries(list.map((i) => [i.key, { ...(r[i.key] ?? { price: i.price.replace('.', ',') }), checked }])) }))
  }

  async function submit() {
    const payload: Array<{ key: string; basePrice: string }> = []
    for (const i of selected) {
      const price = toPriceString(row(i).price)
      if (price === null) return setError(`Preço inválido em "${i.name}".`)
      payload.push({ key: i.key, basePrice: price })
    }
    setError('')
    setSaving(true)
    try {
      const result = await catalogService.importTemplate(packKey, payload)
      const skipped = result.skipped.length ? ` (${result.skipped.length} já existiam e foram mantidos)` : ''
      toast(`${result.created} ${result.created === 1 ? 'item importado' : 'itens importados'}${skipped}.`)
      onImported()
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{pack.data.name}</p>
          <p className="text-muted-foreground text-xs">Os valores são de referência — ajuste conforme a sua região.</p>
        </div>
        <div className="flex items-center gap-1">
          {onBack && <Button type="button" variant="ghost" size="sm" onClick={onBack}>Trocar nicho</Button>}
          <Button type="button" variant="ghost" size="sm" onClick={() => setMany(all, true)}>Marcar todos</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMany(all, false)}>Desmarcar todos</Button>
        </div>
      </div>

      <div className="max-h-[52vh] space-y-5 overflow-y-auto pr-1">
        {groups.map(([category, list]) => {
          const allChecked = list.every((i) => row(i).checked)
          return (
            <section key={category} aria-label={category}>
              <label className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="accent-primary size-4" checked={allChecked} onChange={(e) => setMany(list, e.target.checked)} aria-label={`Selecionar categoria ${category}`} />
                {category}
                <span className="text-muted-foreground text-xs font-normal">{list.length} itens</span>
              </label>
              <ul className="divide-y rounded-md border">
                {list.map((i) => (
                  <li key={i.key} className="flex items-center gap-3 px-3 py-2">
                    <input type="checkbox" className="accent-primary size-4" checked={row(i).checked} onChange={(e) => patch(i, { checked: e.target.checked })} aria-label={`Importar ${i.name}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={i.description}>{i.name}</p>
                      <p className="text-muted-foreground text-xs">por {unitLabel(i.unit)} · sugerido {formatCurrency(i.price)}</p>
                    </div>
                    <Input aria-label={`Preço de ${i.name}`} inputMode="decimal" className="w-28 text-right" disabled={!row(i).checked} value={row(i).price} onChange={(e) => patch(i, { price: e.target.value })} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {error && <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{error}</div>}
      <div className="flex items-center justify-between gap-2 border-t pt-4">
        <p className="text-muted-foreground text-xs">Itens com o mesmo nome já cadastrados são mantidos como estão.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" disabled={saving || selected.length === 0} onClick={submit}>
            {saving ? 'Importando…' : `Importar ${selected.length} ${selected.length === 1 ? 'item' : 'itens'}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
