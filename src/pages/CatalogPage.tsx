import { MoreHorizontal, Package, Pencil, Search, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog, Modal } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Field, Select, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useMockLoad } from '@/hooks/useMockLoad'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { db } from '@/mocks/store'
import type { CatalogItem } from '@/types'

const categories = ['Serviços', 'Produtos', 'Projetos', 'Contratos']
const units = ['un', 'hora', 'm²', 'ponto', 'mês']
const blank = { name: '', description: '', category: 'Serviços', price: '', unit: 'un', active: true }

export default function CatalogPage() {
  const loading = useMockLoad()
  const toast = useToast()
  const [, force] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [editing, setEditing] = useState<CatalogItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<CatalogItem | null>(null)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})

  const rows = db.catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'all' || p.category === category) &&
      (activeFilter === 'all' || (activeFilter === 'active') === p.active),
  )

  function openForm(p: CatalogItem | 'new') {
    setErrors({})
    setForm(p === 'new' ? blank : { ...p, price: String(p.price) })
    setEditing(p)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const n: typeof errors = {}
    if (!form.name.trim()) n.name = 'Informe o nome do item.'
    if (!(Number(form.price) > 0)) n.price = 'Informe um preço maior que zero.'
    setErrors(n)
    if (Object.keys(n).length) return
    const data = { ...form, price: Number(form.price) }
    if (editing === 'new') db.catalog.unshift({ id: `p${Date.now()}`, ...data })
    else if (editing) Object.assign(editing, data)
    toast(editing === 'new' ? 'Item adicionado ao catálogo.' : 'Item atualizado.')
    setEditing(null)
    force((x) => x + 1)
  }

  return (
    <>
      <PageHeader
        title="Catálogo"
        description="Gerencie seus produtos e serviços"
        actions={<Button onClick={() => openForm('new')}>+ Adicionar item</Button>}
      />
      <Card className="gap-0 p-0">
        <div className="flex items-center gap-3 border-b p-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input aria-label="Pesquisar no catálogo" placeholder="Pesquisar por nome" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select aria-label="Categoria" className="w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select aria-label="Situação" className="w-40" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="all">Ativos e inativos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </Select>
        </div>
        {loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState icon={Package} title="Nenhum item encontrado" description="Cadastre produtos e serviços para usá-los nos orçamentos." action={<Button onClick={() => openForm('new')}>+ Adicionar item</Button>} />
        ) : (
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
                  <TD>{p.category}</TD>
                  <TD className="text-muted-foreground max-w-64 truncate">{p.description}</TD>
                  <TD>{p.unit}</TD>
                  <TD>{formatCurrency(p.price)}</TD>
                  <TD>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', p.active ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground')}>
                      {p.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </TD>
                  <TD>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Ações de ${p.name}`}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openForm(p)}><Pencil /> Editar</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(p)}><Trash2 /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Adicionar item' : 'Editar item'} description="Dados do produto ou serviço.">
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Nome" htmlFor="p-name" error={errors.name}>
            <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descrição" htmlFor="p-desc">
            <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Categoria" htmlFor="p-cat">
              <Select id="p-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Preço" htmlFor="p-price" error={errors.price}>
              <Input id="p-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Unidade" htmlFor="p-unit">
              <Select id="p-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {units.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-primary size-4" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Item ativo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir item?"
        description={`"${deleting?.name ?? ''}" será removido do catálogo.`}
        onConfirm={() => {
          if (deleting) db.catalog.splice(db.catalog.indexOf(deleting), 1)
          toast('Item excluído.')
          force((x) => x + 1)
        }}
      />
    </>
  )
}
