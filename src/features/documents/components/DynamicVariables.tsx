import { variables } from '../constants'

import { InfoTip } from './InfoTip'

/** Lista de variáveis dinâmicas; clicar insere no campo de texto em foco. */
export function DynamicVariables({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
        Variáveis dinâmicas
        <InfoTip>Clique para inserir no campo de texto selecionado. São substituídas automaticamente ao gerar o documento.</InfoTip>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {variables.map((v) => (
          <button
            key={v.key}
            type="button"
            title={v.hint}
            // mousedown evita que o textarea perca o foco antes da inserção
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(`{{${v.key}}}`)}
            className="bg-accent hover:bg-primary/20 rounded-md px-2 py-1 font-mono text-[11px] transition-colors"
          >
            {`{{${v.key}}}`}
          </button>
        ))}
      </div>
    </div>
  )
}
