import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export type ClientSkillStatus = 'active' | 'disabled'

export type ClientSkill = {
  id: string
  clientId: string
  skillName: string
  status: ClientSkillStatus
  createdAt: string
}

type ClientSkillRow = {
  id: string
  client_id: string
  skill_name: string
  status: ClientSkillStatus
  created_at: string
}

function rowToSkill(row: ClientSkillRow): ClientSkill {
  return {
    id: row.id,
    clientId: row.client_id,
    skillName: row.skill_name,
    status: row.status,
    createdAt: row.created_at,
  }
}

export async function getClientSkills(clientId: string): Promise<ClientSkill[]> {
  if (!isSupabaseConfigured()) return []

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('client_skills')
    .select('*')
    .eq('client_id', clientId)
    .order('skill_name', { ascending: true })

  if (error) throw new Error(`getClientSkills(${clientId}) failed: ${error.message}`)
  return (data ?? []).map((r) => rowToSkill(r as ClientSkillRow))
}

export async function getClientSkillCount(clientId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0

  const db = getSupabaseAdmin()
  const { count, error } = await db
    .from('client_skills')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'active')

  if (error) throw new Error(`getClientSkillCount(${clientId}) failed: ${error.message}`)
  return count ?? 0
}
