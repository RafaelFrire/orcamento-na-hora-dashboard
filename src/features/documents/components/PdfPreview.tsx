import { Download, Maximize2, X } from 'lucide-react'
import { Dialog as D } from 'radix-ui'
import { useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Button } from '@/components/ui/button'

import { sampleData } from '../mocks'
import type { Branding, DocumentSettings, DocumentTemplate } from '../types'
import { PAGE, PdfDocument } from './PdfDocument'

interface Props {
  template: DocumentTemplate
  branding: Branding
  settings: DocumentSettings
}

/** Papel escalado para caber na largura disponível. */
function ScaledPaper({ template, branding, settings, maxScale = 1 }: Props & { maxScale?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [height, setHeight] = useState(0)
  const w = PAGE[settings.orientation].w

  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(Math.min(maxScale, el.clientWidth / w))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, maxScale])

  useEffect(() => {
    const el = paper.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={box} className="w-full">
      <div style={{ width: w * scale, height: height * scale, margin: '0 auto' }} className="overflow-hidden rounded-sm shadow-[0_8px_30px_rgba(23,25,29,0.18)] ring-1 ring-black/5">
        <div ref={paper} style={{ width: w, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <PdfDocument template={template} branding={branding} settings={settings} data={sampleData} />
        </div>
      </div>
    </div>
  )
}

function printPdf({ template, branding, settings }: Props) {
  const html = renderToStaticMarkup(<PdfDocument template={template} branding={branding} settings={settings} data={sampleData} />)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) return
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${template.title.replace(/[<>]/g, '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
<style>@page{size:A4 ${settings.orientation};margin:0}html,body{margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>${html}</body></html>`)
  doc.close()
  const go = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => iframe.remove(), 2000)
  }
  // aguarda as fontes antes de abrir o diálogo de impressão
  const fonts = (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts
  if (fonts) fonts.ready.then(() => setTimeout(go, 150))
  else setTimeout(go, 600)
}

export function PdfPreview(props: Props) {
  const [full, setFull] = useState(false)

  return (
    <div className="bg-card flex flex-col overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div>
          <p className="text-sm font-semibold">Pré-visualização</p>
          <p className="text-muted-foreground text-xs">Atualizada em tempo real · dados de exemplo</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Tela cheia" title="Visualizar em tela cheia" onClick={() => setFull(true)}>
            <Maximize2 />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Baixar PDF de exemplo" title="Baixar PDF de exemplo" onClick={() => printPdf(props)}>
            <Download />
          </Button>
        </div>
      </div>
      <div className="bg-muted/70 max-h-[calc(100vh-14rem)] overflow-y-auto p-4">
        <ScaledPaper {...props} />
      </div>
      <div className="flex gap-2 border-t p-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setFull(true)}>
          <Maximize2 /> Tela cheia
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => printPdf(props)}>
          <Download /> Baixar PDF de exemplo
        </Button>
      </div>

      <D.Root open={full} onOpenChange={setFull}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-black/70" />
          <D.Content className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-xl bg-[#2a2c31] shadow-2xl outline-none">
            <div className="flex items-center justify-between px-5 py-3 text-white">
              <div>
                <D.Title className="text-sm font-semibold">{props.template.name}</D.Title>
                <D.Description className="text-xs text-white/60">Pré-visualização com dados de exemplo</D.Description>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => printPdf(props)}>
                  <Download /> Baixar PDF de exemplo
                </Button>
                <D.Close asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Fechar" className="text-white hover:bg-white/10 hover:text-white">
                    <X />
                  </Button>
                </D.Close>
              </div>
            </div>
            <div className="flex-1 overflow-auto px-6 pb-8">
              <div className="mx-auto max-w-[1000px]">
                <ScaledPaper {...props} />
              </div>
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </div>
  )
}
