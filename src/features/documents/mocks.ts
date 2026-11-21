import type { Branding, DocumentConfig, DocumentSettings, DocumentTemplate, SampleData } from './types'

export const defaultBranding: Branding = {
  logo: null,
  tradeName: 'Atelier Prime Reformas',
  legalName: 'Prime Reformas e Construções LTDA',
  cnpj: '12.345.678/0001-90',
  phone: '(11) 3456-7890',
  whatsapp: '(11) 98765-4321',
  email: 'contato@atelierprime.com.br',
  address: 'Av. Paulista, 1000 — São Paulo/SP',
  website: 'www.atelierprime.com.br',
  primary: '#17191d',
  secondary: '#3a3d44',
  accent: '#c5a059',
  font: 'playfair',
  style: 'premium',
}

export const defaultSettings: DocumentSettings = {
  format: 'A4',
  orientation: 'portrait',
  showLogo: true,
  showCompany: true,
  headerText: '',
  footerText: 'Obrigado pela preferência.',
  pageNumbers: true,
  issueDate: true,
  signature: true,
  defaultNotes: 'Valores sujeitos a alteração após vistoria técnica no local.',
  defaultTerms: 'Pagamento: 50% na aprovação e 50% na entrega. Validade de 15 dias.',
}

export const sampleData: SampleData = {
  clientName: 'Marina Albuquerque',
  clientDocument: '123.456.789-00',
  clientAddress: 'Rua das Acácias, 245 — Pinheiros, São Paulo/SP',
  quoteNumber: 'ORC-2026-0142',
  discountPercent: 5,
  items: [
    { category: 'Pintura', name: 'Pintura interna', description: 'Paredes e tetos, duas demãos', unit: 'm²', quantity: 120, unitPrice: 28 },
    { category: 'Pintura', name: 'Pintura de fachada', description: 'Inclui preparação da superfície', unit: 'm²', quantity: 45, unitPrice: 42, from: true },
    { category: 'Elétrica', name: 'Troca de tomadas e interruptores', description: 'Material incluso', unit: 'ponto', quantity: 18, unitPrice: 35 },
    { category: 'Elétrica', name: 'Instalação de luminárias', description: 'Mão de obra', unit: 'un', quantity: 8, unitPrice: 60, from: true },
    { category: 'Acabamento', name: 'Instalação de rodapé', description: 'Rodapé de 10 cm em MDF', unit: 'm', quantity: 60, unitPrice: 22 },
  ],
}

const sec = (p: string, n: number, heading: string, body: string) => ({ id: `${p}-${n}`, heading, body })

export const initialTemplates: DocumentTemplate[] = [
  {
    id: 'tpl-servicos-catalogo',
    name: 'Catálogo de serviços',
    description: 'Tabela organizada por categoria com unidade de cobrança.',
    category: 'servicos',
    kind: 'price-table',
    builtIn: true,
    title: 'Tabela de serviços e preços',
    sections: [
      sec('sc', 1, 'Apresentação', 'A {{empresa_nome}} apresenta sua tabela de serviços vigente em {{data_emissao}}.'),
      sec('sc', 2, 'Observações', 'Valores "a partir de" dependem de avaliação prévia. Preços sujeitos a reajuste sem aviso prévio.'),
    ],
  },
  {
    id: 'tpl-servicos-simples',
    name: 'Lista de preços simples',
    description: 'Versão enxuta, ideal para enviar por WhatsApp.',
    category: 'servicos',
    kind: 'price-table',
    builtIn: true,
    title: 'Lista de preços',
    sections: [sec('ss', 1, 'Observações', 'Consulte-nos para pacotes e condições especiais.')],
  },
  {
    id: 'tpl-orcamento-completo',
    name: 'Orçamento completo',
    description: 'Dados do cliente, itens, desconto, total, condições e validade.',
    category: 'orcamento',
    kind: 'quote',
    builtIn: true,
    title: 'Orçamento {{numero_orcamento}}',
    sections: [
      sec('oc', 1, 'Condições de pagamento', '{{condicoes_padrao}}'),
      sec('oc', 2, 'Prazo de validade', 'Esta proposta é válida por 15 dias a partir de {{data_emissao}}.'),
      sec('oc', 3, 'Observações', '{{observacoes_padrao}}'),
    ],
  },
  {
    id: 'tpl-orcamento-resumido',
    name: 'Orçamento resumido',
    description: 'Apenas itens e valor total, para propostas rápidas.',
    category: 'orcamento',
    kind: 'quote',
    builtIn: true,
    title: 'Proposta comercial',
    sections: [sec('or', 1, 'Observações', '{{observacoes_padrao}}')],
  },
  {
    id: 'tpl-contrato-servicos',
    name: 'Contrato de prestação de serviços',
    description: 'Cláusulas, obrigações das partes, pagamento, prazo e garantias.',
    category: 'contrato',
    kind: 'contract',
    builtIn: true,
    title: 'Contrato de prestação de serviços',
    sections: [
      sec('ct', 1, 'Introdução', 'Pelo presente instrumento, {{empresa_nome}}, inscrita no CNPJ {{empresa_cnpj}}, doravante CONTRATADA, e {{cliente_nome}}, documento {{cliente_documento}}, residente em {{cliente_endereco}}, doravante CONTRATANTE, firmam o presente contrato.'),
      sec('ct', 2, 'Cláusula 1 — Objeto', 'A CONTRATADA prestará os seguintes serviços:\n{{descricao_servicos}}'),
      sec('ct', 3, 'Cláusula 2 — Obrigações das partes', 'A CONTRATADA executará os serviços com zelo e qualidade técnica. O CONTRATANTE garantirá acesso ao local e efetuará os pagamentos nos prazos acordados.'),
      sec('ct', 4, 'Cláusula 3 — Condições de pagamento', 'O valor total é de {{valor_total}}, conforme o orçamento {{numero_orcamento}}.'),
      sec('ct', 5, 'Cláusula 4 — Prazo de execução', 'Os serviços serão executados em até 30 dias corridos após a assinatura.'),
      sec('ct', 6, 'Cláusula 5 — Garantias', 'A CONTRATADA garante os serviços por 90 dias contados da entrega.'),
    ],
  },
  {
    id: 'tpl-termos',
    name: 'Termos e condições',
    description: 'Termos gerais de contratação dos serviços.',
    category: 'contrato',
    kind: 'terms',
    builtIn: true,
    title: 'Termos e condições',
    sections: [
      sec('tc', 1, 'Aceite', 'Ao contratar a {{empresa_nome}}, o cliente {{cliente_nome}} declara estar de acordo com os termos abaixo.'),
      sec('tc', 2, 'Cancelamentos', 'Cancelamentos devem ser comunicados com 48 horas de antecedência.'),
    ],
  },
  {
    id: 'tpl-garantia',
    name: 'Termo de garantia',
    description: 'Cobertura, prazo e exclusões da garantia do serviço.',
    category: 'contrato',
    kind: 'warranty',
    builtIn: true,
    title: 'Termo de garantia',
    sections: [
      sec('tg', 1, 'Cobertura', 'A {{empresa_nome}} garante os serviços realizados para {{cliente_nome}} contra defeitos de execução.'),
      sec('tg', 2, 'Prazo', 'A garantia é de 90 dias a partir de {{data_emissao}}.'),
      sec('tg', 3, 'Exclusões', 'Não cobre danos por mau uso, intervenção de terceiros ou desgaste natural.'),
    ],
  },
  {
    id: 'tpl-recibo',
    name: 'Recibo',
    description: 'Comprovante de pagamento simples.',
    category: 'contrato',
    kind: 'receipt',
    builtIn: true,
    title: 'Recibo',
    sections: [sec('rc', 1, 'Declaração', 'Recebi de {{cliente_nome}}, documento {{cliente_documento}}, a quantia de {{valor_total}}, referente ao orçamento {{numero_orcamento}}.')],
  },
]

export const initialConfig: DocumentConfig = {
  branding: defaultBranding,
  settings: defaultSettings,
  templates: initialTemplates,
  defaults: {
    servicos: 'tpl-servicos-catalogo',
    orcamento: 'tpl-orcamento-completo',
    contrato: 'tpl-contrato-servicos',
  },
  selectedId: 'tpl-orcamento-completo',
}
