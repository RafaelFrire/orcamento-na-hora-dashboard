import type { Branding, FontKey, StylePreset, TemplateCategory } from './types'

export const categories: { key: TemplateCategory; label: string; description: string }[] = [
  { key: 'servicos', label: 'Tabela de serviços e preços', description: 'Catálogo de serviços, valores e unidades de cobrança.' },
  { key: 'orcamento', label: 'Orçamentos comerciais', description: 'Proposta completa com itens, descontos e condições.' },
  { key: 'contrato', label: 'Contratos e documentos', description: 'Contratos, termos, garantias e recibos.' },
]

export const fonts: Record<FontKey, { label: string; stack: string }> = {
  inter: { label: 'Inter — limpa e moderna', stack: "'Inter', Helvetica, Arial, sans-serif" },
  montserrat: { label: 'Montserrat — geométrica', stack: "'Montserrat', Helvetica, Arial, sans-serif" },
  playfair: { label: 'Playfair Display — elegante', stack: "'Playfair Display', Georgia, serif" },
  georgia: { label: 'Georgia — clássica', stack: "Georgia, 'Times New Roman', serif" },
  arial: { label: 'Arial — neutra', stack: 'Arial, Helvetica, sans-serif' },
}

export interface PresetDef {
  label: string
  description: string
  colors: Pick<Branding, 'primary' | 'secondary' | 'accent' | 'font'>
}

export const presets: Record<StylePreset, PresetDef> = {
  minimalista: { label: 'Minimalista', description: 'Muito espaço em branco e linhas finas.', colors: { primary: '#2b2d31', secondary: '#6b7078', accent: '#c5a059', font: 'inter' } },
  moderno: { label: 'Moderno', description: 'Faixa lateral e tabela suave.', colors: { primary: '#1f2937', secondary: '#4b5563', accent: '#c5a059', font: 'montserrat' } },
  corporativo: { label: 'Corporativo', description: 'Cabeçalho em bloco de cor sólida.', colors: { primary: '#1f3a5f', secondary: '#3d5a80', accent: '#c5a059', font: 'arial' } },
  premium: { label: 'Premium', description: 'Cabeçalho escuro com detalhes dourados.', colors: { primary: '#17191d', secondary: '#3a3d44', accent: '#c5a059', font: 'playfair' } },
  classico: { label: 'Clássico', description: 'Centralizado, serifado e com moldura.', colors: { primary: '#4a2f27', secondary: '#7a5c52', accent: '#a8813b', font: 'georgia' } },
}

export const variables: { key: string; label: string; hint: string }[] = [
  { key: 'empresa_nome', label: 'Nome da empresa', hint: 'Nome comercial definido na identidade visual.' },
  { key: 'empresa_cnpj', label: 'CNPJ da empresa', hint: 'CNPJ cadastrado na identidade visual.' },
  { key: 'cliente_nome', label: 'Nome do cliente', hint: 'Nome do cliente do orçamento.' },
  { key: 'cliente_documento', label: 'Documento do cliente', hint: 'CPF ou CNPJ do cliente.' },
  { key: 'cliente_endereco', label: 'Endereço do cliente', hint: 'Endereço completo do cliente.' },
  { key: 'data_emissao', label: 'Data de emissão', hint: 'Data em que o documento é gerado.' },
  { key: 'numero_orcamento', label: 'Número do orçamento', hint: 'Numeração sequencial do orçamento.' },
  { key: 'valor_total', label: 'Valor total', hint: 'Soma dos itens já com descontos.' },
  { key: 'descricao_servicos', label: 'Descrição dos serviços', hint: 'Lista dos serviços e produtos do orçamento.' },
]
