import { Field, Select, Textarea } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import type { DocumentSettings as Settings } from '../types'
import { Group, Toggle } from './InfoTip'

interface Props {
  settings: Settings
  onChange: (p: Partial<Settings>) => void
}

export function DocumentSettings({ settings: s, onChange }: Props) {
  return (
    <div className="space-y-7">
      <Group title="Página">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Formato" htmlFor="d-format">
            <Select id="d-format" value={s.format} onChange={() => onChange({ format: 'A4' })}>
              <option value="A4">A4 (210 × 297 mm)</option>
            </Select>
          </Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium">Orientação</span>
            <div className="grid grid-cols-2 gap-2">
              {(['portrait', 'landscape'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={s.orientation === o}
                  onClick={() => onChange({ orientation: o })}
                  className={cn('hover:bg-accent flex h-9 items-center justify-center gap-2 rounded-md border text-sm', s.orientation === o && 'border-primary bg-accent font-medium')}
                >
                  <span className={cn('border-foreground/50 rounded-[2px] border', o === 'portrait' ? 'h-4 w-3' : 'h-3 w-4')} />
                  {o === 'portrait' ? 'Retrato' : 'Paisagem'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Group>

      <Group title="Exibição">
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Exibir logo" checked={s.showLogo} onChange={(showLogo) => onChange({ showLogo })} />
          <Toggle label="Exibir dados da empresa" checked={s.showCompany} onChange={(showCompany) => onChange({ showCompany })} hint="CNPJ, contatos e endereço no cabeçalho." />
          <Toggle label="Numeração de páginas" checked={s.pageNumbers} onChange={(pageNumbers) => onChange({ pageNumbers })} />
          <Toggle label="Data de emissão" checked={s.issueDate} onChange={(issueDate) => onChange({ issueDate })} />
          <Toggle label="Campo de assinatura" checked={s.signature} onChange={(signature) => onChange({ signature })} hint="Linhas de assinatura ao final do documento." />
        </div>
      </Group>

      <Group title="Cabeçalho e rodapé">
        <Field label="Texto do cabeçalho" htmlFor="d-header">
          <Input id="d-header" value={s.headerText} onChange={(e) => onChange({ headerText: e.target.value })} placeholder="Ex.: Reformas e acabamentos desde 2010" />
        </Field>
        <Field label="Texto do rodapé" htmlFor="d-footer">
          <Input id="d-footer" value={s.footerText} onChange={(e) => onChange({ footerText: e.target.value })} placeholder="Ex.: Obrigado pela preferência." />
        </Field>
      </Group>

      <Group
        title="Textos padrão"
        hint={
          <>
            Usados quando o modelo tem as variáveis <code>{'{{condicoes_padrao}}'}</code> e <code>{'{{observacoes_padrao}}'}</code>.
          </>
        }
      >
        <Field label="Condições comerciais padrão" htmlFor="d-terms">
          <Textarea id="d-terms" value={s.defaultTerms} onChange={(e) => onChange({ defaultTerms: e.target.value })} />
        </Field>
        <Field label="Observações padrão" htmlFor="d-notes">
          <Textarea id="d-notes" value={s.defaultNotes} onChange={(e) => onChange({ defaultNotes: e.target.value })} />
        </Field>
      </Group>
    </div>
  )
}
