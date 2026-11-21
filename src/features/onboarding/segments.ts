/** Segmentos disponíveis no cadastro. `key` é o mesmo do modelo de catálogo no backend. */
export const availableSegments = [
  {
    key: 'refrigeracao-climatizacao',
    name: 'Refrigeração e climatização',
    description: 'Assistência técnica de ar-condicionado e refrigeração comercial.',
    highlights: ['Manutenção preventiva e corretiva', 'Instalação e desinstalação', 'Catálogo pronto com serviços e peças'],
  },
] as const

export type SegmentKey = (typeof availableSegments)[number]['key']
