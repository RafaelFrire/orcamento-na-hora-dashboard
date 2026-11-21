import { ImagePlus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { fonts, presets } from '../constants'
import { isHex } from '../render'
import type { Branding, FontKey, StylePreset } from '../types'
import { Group } from './InfoTip'
import { LogoUploadModal } from './LogoUploadModal'

interface Props {
  branding: Branding
  onChange: (p: Partial<Branding>) => void
  onPreset: (s: StylePreset) => void
}

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2" title={hint}>
        <input
          type="color"
          aria-label={`Seletor de ${label.toLowerCase()}`}
          value={isHex(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
        />
        <Input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!isHex(value)} className="font-mono text-xs uppercase" maxLength={7} />
      </div>
    </Field>
  )
}

export function BrandingSettings({ branding: b, onChange, onPreset }: Props) {
  const [logoOpen, setLogoOpen] = useState(false)
  const text = (k: keyof Branding) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ [k]: e.target.value })

  return (
    <div className="space-y-7">
      <Group title="Estilo do documento" hint="Escolher um estilo ajusta cores e tipografia de uma vez. Você ainda pode refinar abaixo.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
          {(Object.keys(presets) as StylePreset[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={b.style === k}
              onClick={() => onPreset(k)}
              className={cn('hover:bg-accent rounded-lg border p-3 text-left transition-colors', b.style === k && 'border-primary bg-accent ring-primary/30 ring-2')}
            >
              <div className="mb-2 flex gap-1">
                {[presets[k].colors.primary, presets[k].colors.secondary, presets[k].colors.accent].map((c) => (
                  <span key={c} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                ))}
              </div>
              <p className="text-sm font-semibold">{presets[k].label}</p>
              <p className="text-muted-foreground text-xs">{presets[k].description}</p>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Logo">
        <div className="flex items-center gap-4">
          <div className="bg-muted flex size-20 items-center justify-center overflow-hidden rounded-lg border">
            {b.logo ? <img src={b.logo} alt="Logo atual" className="max-h-full max-w-full object-contain" /> : <ImagePlus className="text-muted-foreground size-6" />}
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => setLogoOpen(true)}>
              {b.logo ? 'Alterar logo' : 'Enviar logo'}
            </Button>
            <p className="text-muted-foreground mt-1.5 text-xs">PNG, JPG, SVG ou WebP · até 2 MB</p>
          </div>
        </div>
        <LogoUploadModal open={logoOpen} onOpenChange={setLogoOpen} current={b.logo} onConfirm={(logo) => onChange({ logo })} />
      </Group>

      <Group title="Dados da empresa">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome comercial" htmlFor="b-trade"><Input id="b-trade" value={b.tradeName} onChange={text('tradeName')} /></Field>
          <Field label="Razão social (opcional)" htmlFor="b-legal"><Input id="b-legal" value={b.legalName} onChange={text('legalName')} /></Field>
          <Field label="CNPJ (opcional)" htmlFor="b-cnpj"><Input id="b-cnpj" value={b.cnpj} onChange={text('cnpj')} /></Field>
          <Field label="E-mail" htmlFor="b-email"><Input id="b-email" type="email" value={b.email} onChange={text('email')} /></Field>
          <Field label="Telefone" htmlFor="b-phone"><Input id="b-phone" value={b.phone} onChange={text('phone')} /></Field>
          <Field label="WhatsApp" htmlFor="b-wpp"><Input id="b-wpp" value={b.whatsapp} onChange={text('whatsapp')} /></Field>
          <Field label="Endereço" htmlFor="b-addr"><Input id="b-addr" value={b.address} onChange={text('address')} /></Field>
          <Field label="Website" htmlFor="b-site"><Input id="b-site" value={b.website} onChange={text('website')} /></Field>
        </div>
      </Group>

      <Group title="Cores e tipografia">
        <div className="grid gap-3 sm:grid-cols-3">
          <ColorField label="Cor primária" value={b.primary} onChange={(primary) => onChange({ primary })} hint="Cabeçalhos, títulos e total." />
          <ColorField label="Cor secundária" value={b.secondary} onChange={(secondary) => onChange({ secondary })} hint="Textos de apoio e detalhes." />
          <ColorField label="Cor de destaque" value={b.accent} onChange={(accent) => onChange({ accent })} hint="Linhas, marcadores e ícones." />
        </div>
        <Field label="Tipografia" htmlFor="b-font">
          <Select id="b-font" value={b.font} onChange={(e) => onChange({ font: e.target.value as FontKey })}>
            {(Object.keys(fonts) as FontKey[]).map((k) => (
              <option key={k} value={k}>{fonts[k].label}</option>
            ))}
          </Select>
        </Field>
      </Group>
    </div>
  )
}
