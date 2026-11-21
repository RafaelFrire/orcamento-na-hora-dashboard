/** Segmentos disponíveis no cadastro. `key` é o mesmo do modelo de catálogo no backend. */
export const availableSegments = [
  {
    key: 'refrigeracao-climatizacao',
    name: 'Refrigeração e climatização',
    description: 'Assistência técnica de ar-condicionado e refrigeração comercial.',
    highlights: ['Manutenção preventiva e corretiva', 'Instalação e desinstalação', 'Catálogo pronto com serviços e peças'],
  },
  {
    key: 'marcenaria',
    name: 'Marcenaria e móveis planejados',
    description: 'Móveis sob medida, montagem, reparos e materiais para marcenarias.',
    highlights: ['Cozinhas, guarda-roupas e painéis planejados', 'Montagem, instalação e reparos', 'Catálogo pronto com serviços e materiais'],
  },
] as const

export type SegmentKey = (typeof availableSegments)[number]['key']
