import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/shared/PageHeader'
import { ErrorNotice } from '@/components/shared/Pager'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { formatDate, roleLabel } from '@/features/team/labels'
import { useApi, useDebounced } from '@/hooks/useApi'
import { adminService } from '@/services/admin'

export default function AdminUsersPage() {
  const [q, setQ] = useState('')
  const debounced = useDebounced(q)
  const users = useApi(() => adminService.users(debounced), [debounced])

  return (
    <>
      <PageHeader title="Usuários" description="Todos os usuários da plataforma, com as empresas a que pertencem e o último acesso." />
      <Card className="gap-4 p-0">
        <div className="relative p-4 pb-0">
          <Search className="text-muted-foreground absolute top-1/2 left-7 size-4 translate-y-[-25%]" />
          <Input aria-label="Buscar usuário" placeholder="Buscar por nome ou e-mail" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {users.error ? (
          <ErrorNotice message={users.error} onRetry={users.reload} />
        ) : !users.data ? (
          <TableSkeleton />
        ) : users.data.users.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum usuário encontrado" />
        ) : (
          <Table aria-label="Usuários">
            <THead>
              <TR>
                <TH>Usuário</TH>
                <TH>Empresas</TH>
                <TH>Último acesso</TH>
                <TH>Cadastro</TH>
              </TR>
            </THead>
            <TBody>
              {users.data.users.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <p className="font-medium">
                      {u.name} {u.isPlatformAdmin && <Badge className="ml-1">Admin</Badge>}
                    </p>
                    <p className="text-muted-foreground text-xs">{u.email}</p>
                  </TD>
                  <TD>
                    {u.memberships.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {u.memberships.map((m) => (
                          <li key={m.organizationId} className="flex flex-wrap items-center gap-2">
                            <Link to={`/admin/empresas/${m.organizationId}`} className="underline-offset-4 hover:underline">{m.organizationName}</Link>
                            <span className="text-muted-foreground text-xs">{roleLabel[m.role]}</span>
                            {m.disabled && <Badge variant="outline">Desativado</Badge>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TD>
                  <TD>{formatDate(u.lastAccessAt)}</TD>
                  <TD>{formatDate(u.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  )
}
