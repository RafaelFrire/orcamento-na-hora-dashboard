import type { CSSProperties, ReactNode } from 'react'

import { fonts } from '../constants'
import { brl, itemTotal, readableOn, resolveVariables, tint, totals } from '../render'
import type { Branding, DocumentSettings, DocumentTemplate, SampleData } from '../types'

export const PAGE = {
  portrait: { w: 794, h: 1123 },
  landscape: { w: 1123, h: 794 },
} as const

interface Props {
  template: DocumentTemplate
  branding: Branding
  settings: DocumentSettings
  data: SampleData
}

/**
 * Renderização "papel" do documento. Usa apenas estilos inline para que o mesmo
 * markup sirva à pré-visualização, à tela cheia e à impressão/PDF.
 * No backend, este componente pode ser substituído pelo mecanismo real de geração.
 */
export function PdfDocument({ template, branding: b, settings: s, data }: Props) {
  const size = PAGE[s.orientation]
  const font = fonts[b.font].stack
  const style = b.style
  const serifHeading = b.font === 'playfair' || b.font === 'georgia'
  const r = (t: string) => resolveVariables(t, b, s, data)
  const sum = totals(data)
  const today = new Date().toLocaleDateString('pt-BR')

  const headerBand = style === 'corporativo' || style === 'premium'
  const headerBg = headerBand ? b.primary : 'transparent'
  const headerFg = headerBand ? readableOn(b.primary) : '#1c1e22'
  const muted = headerBand ? tint(headerFg, 0.72) : '#6b7078'
  const centered = style === 'classico'

  const page: CSSProperties = {
    width: size.w,
    minHeight: size.h,
    background: '#fff',
    color: '#25282d',
    fontFamily: font,
    fontSize: 13,
    lineHeight: 1.5,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    position: 'relative',
    outline: style === 'classico' ? `1px solid ${b.accent}` : undefined,
    outlineOffset: style === 'classico' ? -22 : undefined,
    border: style === 'classico' ? `6px double ${tint(b.accent, 0.55)}` : undefined,
  }

  const hasCompanyLine = s.showCompany
  const companyLines = [
    b.legalName && b.legalName !== b.tradeName ? b.legalName : '',
    b.cnpj && `CNPJ ${b.cnpj}`,
    [b.phone, b.whatsapp && `WhatsApp ${b.whatsapp}`].filter(Boolean).join(' · '),
    [b.email, b.website].filter(Boolean).join(' · '),
    b.address,
  ].filter(Boolean) as string[]

  const pad = style === 'classico' ? 52 : 48

  return (
    <div style={page} data-pdf-page>
      {/* Cabeçalho */}
      <header
        style={{
          background: headerBg,
          color: headerFg,
          padding: `${headerBand ? 34 : 40}px ${pad}px ${headerBand ? 30 : 22}px`,
          borderBottom:
            style === 'premium' ? `3px solid ${b.accent}` : style === 'minimalista' ? `1px solid ${tint('#17191d', 0.14)}` : undefined,
          borderLeft: style === 'moderno' ? `8px solid ${b.accent}` : undefined,
          display: 'flex',
          flexDirection: centered ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          textAlign: centered ? 'center' : 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexDirection: centered ? 'column' : 'row' }}>
          {s.showLogo &&
            (b.logo ? (
              <img src={b.logo} alt="" style={{ maxHeight: 54, maxWidth: 150, objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: style === 'classico' ? 24 : 10,
                  background: b.accent,
                  color: readableOn(b.accent),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 20,
                  fontFamily: font,
                }}
              >
                {(b.tradeName || 'E').trim().charAt(0).toUpperCase()}
              </div>
            ))}
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: serifHeading ? font : font, letterSpacing: style === 'premium' ? 0.4 : 0 }}>
              {b.tradeName || 'Nome da empresa'}
            </div>
            {s.headerText && <div style={{ fontSize: 11.5, color: muted }}>{r(s.headerText)}</div>}
          </div>
        </div>
        {hasCompanyLine && (
          <div style={{ fontSize: 10.5, lineHeight: 1.55, color: muted, textAlign: centered ? 'center' : 'right' }}>
            {companyLines.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
        )}
      </header>

      {/* Corpo */}
      <main style={{ flex: 1, padding: `30px ${pad}px 20px` }}>
        <div style={{ textAlign: centered ? 'center' : 'left', marginBottom: 22 }}>
          <h1
            style={{
              margin: 0,
              fontSize: style === 'minimalista' ? 28 : 24,
              fontWeight: style === 'minimalista' ? 300 : 700,
              color: style === 'corporativo' || style === 'moderno' ? b.primary : '#17191d',
              fontFamily: font,
              letterSpacing: style === 'minimalista' ? -0.3 : 0,
            }}
          >
            {r(template.title)}
          </h1>
          <div style={{ width: 44, height: 3, background: b.accent, margin: centered ? '10px auto 0' : '10px 0 0', borderRadius: 2 }} />
          {s.issueDate && <div style={{ fontSize: 11.5, color: '#6b7078', marginTop: 10 }}>Emitido em {today}</div>}
        </div>

        {template.kind === 'quote' && <ClientBox b={b} data={data} />}

        {template.kind === 'price-table' && <PriceTable b={b} data={data} />}
        {template.kind === 'quote' && <QuoteTable b={b} data={data} sum={sum} short={template.id === 'tpl-orcamento-resumido'} />}

        {template.sections.map((sec) => (
          <Section key={sec.id} heading={sec.heading ? r(sec.heading) : ''} accent={b.accent} primary={b.primary} contract={template.category === 'contrato'}>
            {r(sec.body)}
          </Section>
        ))}

        {s.signature && template.kind !== 'price-table' && (
          <div style={{ display: 'flex', gap: 40, marginTop: 56, pageBreakInside: 'avoid' }}>
            {[b.tradeName || 'Empresa', template.kind === 'quote' || template.kind === 'receipt' ? 'Cliente' : data.clientName].map((who, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #8a8f97', paddingTop: 6, fontSize: 11.5, color: '#4b5058' }}>{who}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer
        style={{
          margin: `0 ${pad}px`,
          padding: '12px 0 22px',
          borderTop: `1px solid ${tint(b.accent, 0.5)}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: '#6b7078',
        }}
      >
        <span>{s.footerText ? r(s.footerText) : ''}</span>
        {s.pageNumbers && <span>Página 1 de 1</span>}
      </footer>
    </div>
  )
}

function Section({ heading, children, accent, primary, contract }: { heading: string; children: ReactNode; accent: string; primary: string; contract: boolean }) {
  return (
    <section style={{ marginTop: 18, pageBreakInside: 'avoid' }}>
      {heading && (
        <h2
          style={{
            margin: '0 0 5px',
            fontSize: contract ? 13.5 : 11,
            fontWeight: 700,
            textTransform: contract ? 'none' : 'uppercase',
            letterSpacing: contract ? 0 : 1,
            color: contract ? primary : accent,
          }}
        >
          {heading}
        </h2>
      )}
      <div style={{ whiteSpace: 'pre-wrap', textAlign: contract ? 'justify' : 'left' }}>{children}</div>
    </section>
  )
}

function ClientBox({ b, data }: { b: Branding; data: SampleData }) {
  return (
    <div style={{ background: tint(b.accent, 0.1), borderLeft: `3px solid ${b.accent}`, borderRadius: 4, padding: '12px 16px', marginBottom: 20, fontSize: 12 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#6b7078', marginBottom: 3 }}>Cliente</div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{data.clientName}</div>
      <div style={{ color: '#4b5058' }}>
        {data.clientDocument} · {data.clientAddress}
      </div>
    </div>
  )
}

function tableHead(b: Branding): CSSProperties {
  const solid = b.style === 'corporativo' || b.style === 'premium'
  return {
    background: solid ? b.primary : b.style === 'moderno' ? tint(b.primary, 0.08) : 'transparent',
    color: solid ? readableOn(b.primary) : b.primary,
    borderBottom: solid ? undefined : `1.5px solid ${b.style === 'minimalista' ? tint('#17191d', 0.25) : b.primary}`,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  }
}

const th: CSSProperties = { padding: '9px 10px', textAlign: 'left', fontWeight: 600 }
const td: CSSProperties = { padding: '9px 10px', borderBottom: '1px solid #ececea', verticalAlign: 'top' }
const right: CSSProperties = { textAlign: 'right', whiteSpace: 'nowrap' }

function PriceTable({ b, data }: { b: Branding; data: SampleData }) {
  const groups = Array.from(new Set(data.items.map((i) => i.category)))
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={tableHead(b)}>
          <th style={th}>Serviço</th>
          <th style={th}>Unidade</th>
          <th style={{ ...th, ...right }}>Preço</th>
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => (
          <PriceGroup key={g} name={g} b={b} items={data.items.filter((i) => i.category === g)} />
        ))}
      </tbody>
    </table>
  )
}

function PriceGroup({ name, items, b }: { name: string; items: SampleData['items']; b: Branding }) {
  return (
    <>
      <tr>
        <td colSpan={3} style={{ padding: '12px 10px 4px', fontWeight: 700, color: b.accent, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {name}
        </td>
      </tr>
      {items.map((i) => (
        <tr key={i.name}>
          <td style={td}>
            <div style={{ fontWeight: 600 }}>{i.name}</div>
            <div style={{ fontSize: 11, color: '#6b7078' }}>{i.description}</div>
          </td>
          <td style={td}>por {i.unit}</td>
          <td style={{ ...td, ...right, fontWeight: 600 }}>
            {i.from && <span style={{ fontWeight: 400, color: '#6b7078', fontSize: 10.5 }}>a partir de </span>}
            {brl(i.unitPrice)}
          </td>
        </tr>
      ))}
    </>
  )
}

function QuoteTable({ b, data, sum, short }: { b: Branding; data: SampleData; sum: ReturnType<typeof totals>; short: boolean }) {
  return (
    <>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={tableHead(b)}>
            <th style={th}>Item</th>
            <th style={{ ...th, ...right }}>Qtd.</th>
            <th style={{ ...th, ...right }}>Valor unit.</th>
            <th style={{ ...th, ...right }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((i) => (
            <tr key={i.name}>
              <td style={td}>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                {!short && <div style={{ fontSize: 11, color: '#6b7078' }}>{i.description}</div>}
              </td>
              <td style={{ ...td, ...right }}>
                {i.quantity} {i.unit}
              </td>
              <td style={{ ...td, ...right }}>{brl(i.unitPrice)}</td>
              <td style={{ ...td, ...right }}>{brl(itemTotal(i))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginLeft: 'auto', width: 250, marginTop: 14, fontSize: 12 }}>
        <Row label="Subtotal" value={brl(sum.subtotal)} />
        <Row label={`Desconto (${data.discountPercent}%)`} value={`− ${brl(sum.discount)}`} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            padding: '10px 12px',
            borderRadius: 4,
            background: b.primary,
            color: readableOn(b.primary),
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <span>Total</span>
          <span>{brl(sum.total)}</span>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 12px', color: '#4b5058' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
