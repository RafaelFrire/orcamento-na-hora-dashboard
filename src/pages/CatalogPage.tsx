import { MoreHorizontal, Package, Pencil, Search, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { ImportTemplateModal } from '@/features/catalog/ImportTemplateModal'
import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice, Pager } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog, Modal } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, Select, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { errorMessage, useApi, useDebounced } from '@/hooks/useApi'
import { formatCurrency, toPriceString, unitCodes, unitLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ApiError } from '@/services/api'
import { catalogService } from '@/services/catalog'
import type { CatalogItem } from '@/types'

const blank = { name: '', description: '', segmentId: '', categoryId: '', price: '', unit: 'UN', active: true }

export default function CatalogPage() {
  const toast = useToast()
  const { membership } = useAuth()
  const canEdit = membership?.role === 'OWNER' || membership?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<{ name?: string; price?: string; segment?: string; form?: string }>({})
  const [saving, setSaving] = useState(false)
  const [newSegment, setNewSegment] = useState('')
  const q = useDebounced(search.trim())

  const segments = useApi(() => catalogService.segments(), [])
  const categories = useApi(() => catalogService.categories(), [])
  const items = useApi(
    () =>
      catalogService.items({
        page,
        pageSize: 20,
        q,
        categoryId: category === 'all' ? undefined : category,
        active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
    [page, q, category, activeFilter],
  )

  const segmentList = segments.data?.data.filter((s) => s.active) ?? []
  const categoryList = categories.data?.data ?? []
  const formCategories = categoryList.filter((c) => c.active && c.segmentId === form.segmentId)
  const rows = items.data?.data ?? []

  function openForm(p: CatalogItem | 'new') {
    setErrors({})
    setNewSegment('')
    setForm(
      p === 'new'
        ? { ...blank, segmentId: segmentList[0]?.id ?? '' }
        : {
            name: p.name,
            description: p.description ?? '',
            segmentId: p.segmentId,
            categoryId: p.categoryId ?? '',
            price: String(Number(p.basePrice)),
            unit: p.unit,
            active: p.active,
          },
    )
    setEditing(p)
  }

  async function createSegment() {
    const name = newSegment.trim()
    if (name.length < 2) return setErrors((e) => ({ ...e, segment: 'Informe o nome do segmento (mín. 2 letras).' }))
    try {
      const seg = await catalogService.createSegment(name)
      setNewSegment('')
      setForm((f) => ({ ...f, segmentId: seg.id, categoryId: '' }))
      setErrors((e) => ({ ...e, segment: undefined }))
      segments.reload()
    } catch (err) {
      setErrors((e) => ({ ...e, segment: errorMessage(err) }))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (form.name.trim().length < 2) n.name = 'Informe o nome do item.'
    const price = toPriceString(form.price)
    if (price === null || !(Number(price) > 0)) n.price = 'Informe um preço maior que zero.'
    if (!form.segmentId) n.segment = 'Selecione ou crie um segmento.'
    setErrors(n)
    if (Object.keys(n).length) return

    const payload = {
      segmentId: form.segmentId,
      name: form.name.trim(),
      description: form.description.trim(),
      basePrice: price!,
      unit: form.unit,
      active: form.active,
    }
    setSaving(true)
    try {
      if (editing === 'new') {
        await catalogService.createItem({ ...payload, ...(form.categoryId ? { categoryId: form.categoryId } : {}) })
      } else if (editing) {
        await catalogService.updateItem(editing.id, { ...payload, categoryId: form.categoryId || null })
      }
      toast(editing === 'new' ? 'Item adicionado ao catálogo.' : 'Item atualizado.')
      setEditing(null)
      items.reload()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ name: 'Já existe um item com este nome.' })
      else if (err instanceof ApiError && err.status === 400 && err.details?.length)
        setErrors({
          name: err.fieldMessage('name'),
          price: err.fieldMessage('basePrice'),
          form: err.details.find((d) => !['name', 'basePrice'].includes(d.field ?? ''))?.message,
        })
      else setErrors({ form: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: CatalogItem) {
    try {
      await catalogService.deleteItem(item.id)
      toast('Item excluído.')
      items.reload()
    } catch (err) {
      toast(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Catálogo"
        description="Gerencie seus produtos e serviços"
        actions={canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImporting(true)}><Sparkles /> Importar modelo</Button>
            <Button onClick={() => openForm('new')}>+ Adicionar item</Button>
          </div>
        )}
      />
      <Card className="gap-0 p-0">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input aria-label="Pesquisar no catálogo" placeholder="Pesquisar por nome ou descrição" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <Select aria-label="Categoria" className="w-44" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            <option value="all">Todas as categorias</option>
            {categoryList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select aria-label="Situação" className="w-40" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1) }}>
            <option value="all">Ativos e inativos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </Select>
        </div>
        {items.error ? (
          <ErrorNotice message={items.error} onRetry={items.reload} />
        ) : items.loading && !items.data ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState icon={Package} title="Nenhum item encontrado" description="Cadastre produtos e serviços para usá-los nos orçamentos ou comece com um modelo pronto do seu nicho." action={canEdit && <div className="flex gap-2"><Button variant="outline" onClick={() => setImporting(true)}><Sparkles /> Importar modelo</Button><Button onClick={() => openForm('new')}>+ Adicionar item</Button></div>} />
        ) : (
          <>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Nome</TH><TH>Categoria</TH><TH>Descrição</TH><TH>Unidade</TH><TH>Preço base</TH><TH>Status</TH><TH className="w-12"><span className="sr-only">Ações</span></TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium">{p.name}</TD>
                    <TD>{p.category?.name ?? p.segment?.name ?? '—'}</TD>
                    <TD className="text-muted-foreground max-w-64 truncate">{p.description}</TD>
                    <TD>{unitLabel(p.unit)}</TD>
                    <TD>{formatCurrency(p.basePrice)}</TD>
                    <TD>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', p.active ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground')}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TD>
                    <TD>
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações de ${p.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openForm(p)}><Pencil /> Editar</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(p)}><Trash2 /> Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {items.data && <Pager pagination={items.data.pagination} onPage={setPage} />}
          </>
        )}
      </Card>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Adicionar item' : 'Editar item'} description="Dados do produto ou serviço.">
        <form onSubmit={submit} noValidate className="space-y-4">
          {errors.form && <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">{errors.form}</div>}
          <Field label="Nome" htmlFor="p-name" error={errors.name}>
            <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descrição" htmlFor="p-desc">
            <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          {segmentList.length === 0 ? (
            <Field label="Novo segmento" htmlFor="p-newseg" error={errors.segment}>
              <div className="flex gap-2">
                <Input id="p-newseg" placeholder="Ex.: Serviços" value={newSegment} onChange={(e) => setNewSegment(e.target.value)} />
                <Button type="button" variant="outline" onClick={createSegment}>Criar segmento</Button>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">Você ainda não tem segmentos. Crie o primeiro para classificar este item.</p>
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Segmento" htmlFor="p-seg" error={errors.segment}>
                <Select id="p-seg" value={form.segmentId} onChange={(e) => setForm({ ...form, segmentId: e.target.value, categoryId: '' })}>
                  {segmentList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Categoria" htmlFor="p-cat">
                <Select id="p-cat" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {formCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço" htmlFor="p-price" error={errors.price}>
              <Input id="p-price" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Unidade" htmlFor="p-unit">
              <Select id="p-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {unitCodes.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-primary size-4" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Item ativo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <ImportTemplateModal
        open={importing}
        preferredKey={membership?.niche}
        onOpenChange={setImporting}
        onImported={() => {
          items.reload()
          segments.reload()
          categories.reload()
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir item?"
        description={`"${deleting?.name ?? ''}" será removido do catálogo.`}
        onConfirm={() => deleting && remove(deleting)}
      />
    </>
  )
}
