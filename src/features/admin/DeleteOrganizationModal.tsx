import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/dialog'
import { Field } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { errorMessage } from '@/hooks/useApi'
import { adminService } from '@/services/admin'

/** Exclusão definitiva: o admin precisa digitar o nome da empresa para confirmar. */
export function DeleteOrganizationModal({
  org,
  onClose,
  onDeleted,
}: {
  org: { id: string; name: string } | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function close() {
    setTyped('')
    setError(null)
    onClose()
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!org) return
    setLoading(true)
    setError(null)
    try {
      await adminService.deleteOrganization(org.id, typed.trim())
      setTyped('')
      onDeleted()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={!!org}
      onOpenChange={(o) => !o && close()}
      title="Excluir empresa"
      description="Esta ação é definitiva e não pode ser desfeita."
    >
      {org && (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-sm">
            Serão apagados <strong>{org.name}</strong> e todos os seus dados: orçamentos, clientes, catálogo, conversas e
            equipe. Usuários que só pertencem a esta empresa também serão removidos. Se quiser apenas bloquear o acesso,
            use <em>Desativar</em>.
          </p>
          {error && (
            <div role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <Field label={`Digite "${org.name}" para confirmar`} htmlFor="confirm-name">
            <Input id="confirm-name" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={loading || typed.trim() !== org.name}>
              {loading && <Loader2 className="size-4 animate-spin" />} Excluir definitivamente
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
