import { Button } from '@/components/ui/button'
import type { Pagination } from '@/types'

export function Pager({ pagination, onPage }: { pagination: Pagination; onPage: (p: number) => void }) {
  if (pagination.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Página {pagination.page} de {pagination.totalPages} · {pagination.total} registros
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => onPage(pagination.page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  )
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 p-4 text-sm">
      <span className="text-destructive">{message}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
