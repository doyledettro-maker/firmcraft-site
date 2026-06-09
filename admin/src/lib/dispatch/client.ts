'use client'

// Client-side fetch helpers for the dispatch board. Thin wrappers over the
// /api/dispatch/* routes that throw Error(message) on failure so callers can
// surface the message (including 422 status-transition rejections).

import type { BoardData, Job, JobDetail, JobPatch } from './types'

async function asError(res: Response): Promise<never> {
  let message = `Request failed (${res.status})`
  try {
    const body = await res.json()
    if (body?.error) message = body.error
  } catch {
    /* non-JSON body */
  }
  throw new Error(message)
}

export async function fetchBoard(window: { from?: string; to?: string }): Promise<BoardData> {
  const params = new URLSearchParams()
  if (window.from) params.set('from', window.from)
  if (window.to) params.set('to', window.to)
  const res = await fetch(`/api/dispatch/board?${params.toString()}`, { cache: 'no-store' })
  if (!res.ok) return asError(res)
  return res.json()
}

export async function fetchJobDetail(jobId: string): Promise<JobDetail> {
  const res = await fetch(`/api/dispatch/jobs/${jobId}`, { cache: 'no-store' })
  if (!res.ok) return asError(res)
  return res.json()
}

export async function patchJob(jobId: string, patch: JobPatch): Promise<Job> {
  const res = await fetch(`/api/dispatch/jobs/${jobId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) return asError(res)
  return res.json()
}
