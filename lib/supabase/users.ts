import { supabase } from './client'
import type { User } from './types'

// 사용자 목록 조회
export async function getUsers(filters?: {
  tier?: string
  approvalStatus?: string
  search?: string
  limit?: number
  offset?: number
}) {
  let query = supabase.from('users').select('*')

  if (filters?.tier) {
    query = query.eq('tier', filters.tier)
  }
  if (filters?.approvalStatus) {
    query = query.eq('approval_status', filters.approvalStatus)
  }
  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
    )
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  return await query.order('created_at', { ascending: false })
}

// 사용자 상세 조회
export async function getUserById(id: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single()

  if (error) throw error
  return data
}

// 사용자 등급 변경
export async function updateUserTier(userId: string, tier: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ tier })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 사용자 승인
export async function approveUser(userId: string, approvedBy: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 사용자 거부
export async function rejectUser(userId: string, approvedBy: string) {
  const { data, error } = await supabase
    .from('users')
    .update({
      approval_status: 'rejected',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 사용자 통계 조회
export async function getUserStats() {
  const [totalUsers, pendingUsers, premiumUsers, adminUsers] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'pending'),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'premium'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
  ])

  return {
    total: totalUsers.count || 0,
    pending: pendingUsers.count || 0,
    premium: premiumUsers.count || 0,
    admin: adminUsers.count || 0,
  }
}

