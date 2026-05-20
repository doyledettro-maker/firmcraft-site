import type { Client } from '@/lib/mock-clients'
import { mockClients, getClient as getMockClient } from '@/lib/mock-clients'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import {
  rowToClient,
  clientInputToRow,
  type ClientRow,
  type ClientCreateInput,
  type ClientUpdateInput,
} from './mappers'

/**
 * Return every non-deleted client, newest first.
 * Falls back to mock data when Supabase isn't configured (local dev).
 */
export async function getClients(): Promise<Client[]> {
  if (!isSupabaseConfigured()) return mockClients

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getClients failed: ${error.message}`)
  return (data ?? []).map((row) => rowToClient(row as ClientRow))
}

export async function getClient(id: string): Promise<Client | undefined> {
  if (!isSupabaseConfigured()) return getMockClient(id)

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error(`getClient(${id}) failed: ${error.message}`)
  if (!data) return undefined
  return rowToClient(data as ClientRow)
}

export async function createClient(input: ClientCreateInput): Promise<Client> {
  if (!isSupabaseConfigured()) {
    throw new Error('createClient requires Supabase to be configured.')
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .insert(clientInputToRow(input))
    .select('*')
    .single()

  if (error) throw new Error(`createClient failed: ${error.message}`)
  return rowToClient(data as ClientRow)
}

export async function updateClient(id: string, input: ClientUpdateInput): Promise<Client> {
  if (!isSupabaseConfigured()) {
    throw new Error('updateClient requires Supabase to be configured.')
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .update(clientInputToRow(input))
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(`updateClient(${id}) failed: ${error.message}`)
  return rowToClient(data as ClientRow)
}
