'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dices, Pencil, X } from 'lucide-react'
import { Badge, Button, Card, CardHeader, CardTitle, Hint, Input } from '@/components/ui'

interface CodeUser {
  id: string
  name: string
  email: string
  code: string | null
}

const CODE_RE = /^\d{4,6}$/

export function EmployeeCodesCard() {
  const [users, setUsers] = useState<CodeUser[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await fetch('/api/settings/employee-codes', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { users: CodeUser[] }
      setUsers(data.users)
    } catch {
      setLoadError('Could not load users from Clerk. Refresh to retry.')
      setUsers([])
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const assignedCodes = useMemo(
    () => new Set((users ?? []).map((u) => u.code).filter(Boolean) as string[]),
    [users],
  )

  function startEdit(u: CodeUser) {
    setEditingId(u.id)
    setDraft(u.code ?? '')
    setRowError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft('')
    setRowError(null)
  }

  function generateCode() {
    // Random 4-digit code that isn't already on the roster. With a handful of
    // techs in a 10k space, a few retries always succeed.
    for (let i = 0; i < 50; i++) {
      const candidate = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      if (!assignedCodes.has(candidate)) {
        setDraft(candidate)
        setRowError(null)
        return
      }
    }
  }

  async function save(userId: string, code: string | null) {
    if (code !== null) {
      if (!CODE_RE.test(code)) {
        setRowError('Code must be 4–6 digits.')
        return
      }
      const taken = users?.find((u) => u.code === code && u.id !== userId)
      if (taken) {
        setRowError(`Code ${code} is already assigned to ${taken.name}.`)
        return
      }
    }
    setSaving(true)
    setRowError(null)
    try {
      const res = await fetch('/api/settings/employee-codes', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setRowError(data.error ?? 'Update failed.')
        return
      }
      setUsers((prev) => prev?.map((u) => (u.id === userId ? { ...u, code } : u)) ?? prev)
      cancelEdit()
    } catch {
      setRowError('Update failed. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[18px]">Employee codes</CardTitle>
        <Hint>
          Sign-in codes for the Firmcraft Work mobile app. Techs punch in a 4–6 digit code instead
          of email and password; codes are stored on each Clerk user and must be unique.
        </Hint>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Code</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users === null ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted border-t border-line">
                  Loading users…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted border-t border-line">
                  {loadError ?? 'No users found in Clerk.'}
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const editing = editingId === u.id
                return (
                  <tr key={u.id} className="hover:bg-paper-2 transition-colors">
                    <td className="px-4 py-3 border-t border-line font-medium whitespace-nowrap">
                      {u.name}
                    </td>
                    <td className="px-4 py-3 border-t border-line text-ink-2 whitespace-nowrap">
                      {u.email || '—'}
                    </td>
                    <td className="px-4 py-3 border-t border-line">
                      {editing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={draft}
                            onChange={(e) => {
                              setDraft(e.target.value.replace(/\D/g, '').slice(0, 6))
                              setRowError(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void save(u.id, draft)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                            inputMode="numeric"
                            placeholder="4–6 digits"
                            autoFocus
                            disabled={saving}
                            className="w-[120px] font-mono tracking-[0.2em] py-1.5"
                            aria-label={`Employee code for ${u.name}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={generateCode}
                            disabled={saving}
                            title="Generate a random unused code"
                          >
                            <Dices size={14} /> Generate
                          </Button>
                        </div>
                      ) : u.code ? (
                        <span className="font-mono text-[14px] tracking-[0.25em]">{u.code}</span>
                      ) : (
                        <Badge tone="amber">No code</Badge>
                      )}
                      {editing && rowError ? (
                        <p className="text-[12.5px] text-danger mt-1.5">{rowError}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 border-t border-line text-right whitespace-nowrap">
                      {editing ? (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void save(u.id, draft)}
                            disabled={saving || !CODE_RE.test(draft)}
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </Button>
                          {u.code ? (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => void save(u.id, null)}
                              disabled={saving}
                              title="Remove this user's code"
                            >
                              Remove
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            disabled={saving}
                            aria-label="Cancel"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(u)}>
                          <Pencil size={13} /> {u.code ? 'Edit' : 'Assign'}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted font-medium ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
