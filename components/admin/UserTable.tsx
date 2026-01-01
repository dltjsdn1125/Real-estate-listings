'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { User } from '@/lib/supabase/types'
import { approveUser, updateUserTier } from '@/lib/supabase/users'
import { supabase } from '@/lib/supabase/client'

interface UserTableProps {
  users: User[]
  onUserUpdate?: () => void
  showTierEdit?: boolean
}

const TIER_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200', icon: 'star' },
  silver: {
    label: 'Silver',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    icon: 'person',
  },
  bronze: {
    label: 'Bronze',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    icon: 'person',
  },
  premium: {
    label: 'Premium',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: 'workspace_premium',
  },
  agent: { label: 'Agent', className: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300', icon: 'home_work' },
  admin: {
    label: 'Admin',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: 'shield_person',
  },
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
  active: {
    label: '활성 (Active)',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-600 dark:bg-green-400',
  },
  pending: {
    label: '승인 대기',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    dotColor: 'bg-orange-600 dark:bg-orange-400',
  },
  suspended: {
    label: '정지 (Suspended)',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dotColor: 'bg-red-600 dark:bg-red-400',
  },
}

export default function UserTable({ users, onUserUpdate, showTierEdit = false }: UserTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [editingTier, setEditingTier] = useState<string | null>(null)
  const [newTier, setNewTier] = useState<string>('')

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map((u) => u.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleApprove = async (userId: string) => {
    setProcessing((prev) => new Set(prev).add(userId))
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      await approveUser(userId, user.id)
      onUserUpdate?.()
    } catch (error) {
      console.error('Error approving user:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleTierChange = async (userId: string, tier: string) => {
    setProcessing((prev) => new Set(prev).add(userId))
    try {
      await updateUserTier(userId, tier)
      setEditingTier(null)
      onUserUpdate?.()
    } catch (error) {
      console.error('Error updating tier:', error)
      alert('등급 변경 중 오류가 발생했습니다.')
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const startTierEdit = (user: User) => {
    setEditingTier(user.id)
    setNewTier(user.tier)
  }

  const cancelTierEdit = () => {
    setEditingTier(null)
    setNewTier('')
  }

  const getStatusDisplay = (user: User) => {
    if (user.approval_status === 'pending') {
      return STATUS_CONFIG.pending
    }
    // 실제로는 suspended 상태를 체크해야 하지만, 현재 스키마에는 없음
    return STATUS_CONFIG.active
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] table-auto text-left">
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400 w-[50px]">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length && users.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-[#dbdfe6] text-primary focus:ring-primary dark:border-[#334155] dark:bg-slate-700"
              />
            </th>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400">
              사용자 정보
            </th>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400">
              전화번호
            </th>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400">
              등급 (TIER)
            </th>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400">
              권한 (ROLE)
            </th>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400">
              상태
            </th>
            <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-slate-400 text-right">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f2f4] dark:divide-[#334155]">
          {users.map((user) => {
            const tierConfig = TIER_CONFIG[user.tier] || TIER_CONFIG.bronze
            const statusConfig = getStatusDisplay(user)
            const isPending = user.approval_status === 'pending'

            return (
              <tr
                key={user.id}
                className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    className="h-4 w-4 rounded border-[#dbdfe6] text-primary focus:ring-primary dark:border-[#334155] dark:bg-slate-700"
                  />
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    {user.profile_image_url ? (
                      <Image
                        src={user.profile_image_url}
                        alt={user.full_name || 'User'}
                        width={40}
                        height={40}
                        className="size-10 rounded-full object-cover bg-gray-200"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                        <span className="material-symbols-outlined text-gray-500">person</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-[#111318] dark:text-white">
                        {user.full_name || '이름 없음'}
                      </p>
                      <p className="text-xs text-[#616f89] dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#111318] dark:text-slate-200">
                  {user.phone || '-'}
                </td>
                <td className="py-4 px-6">
                  {showTierEdit && editingTier === user.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={newTier}
                        onChange={(e) => setNewTier(e.target.value)}
                        className="h-8 rounded-lg border border-[#dbdfe6] bg-white px-2 py-1 text-xs font-medium text-[#111318] focus:border-primary focus:ring-1 focus:ring-primary dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                        disabled={processing.has(user.id)}
                      >
                        <option value="bronze">일반 회원 (Bronze)</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="premium">Premium</option>
                        <option value="agent">공인중개사 (Agent)</option>
                      </select>
                      <button
                        onClick={() => handleTierChange(user.id, newTier)}
                        disabled={processing.has(user.id) || newTier === user.tier}
                        className="flex h-8 items-center justify-center rounded-lg bg-primary px-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {processing.has(user.id) ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={cancelTierEdit}
                        disabled={processing.has(user.id)}
                        className="flex h-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white px-2 text-xs font-bold text-[#111318] hover:bg-gray-50 transition-colors disabled:opacity-50 dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tierConfig.className}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{tierConfig.icon}</span>
                        {tierConfig.label}
                      </span>
                      {showTierEdit && (
                        <button
                          onClick={() => startTierEdit(user)}
                          disabled={processing.has(user.id)}
                          className="flex size-6 items-center justify-center rounded text-[#616f89] hover:text-primary transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-[#616f89] dark:text-slate-400">
                  {user.tier === 'admin' ? 'Admin' : user.tier === 'agent' ? 'Agent' : 'User'}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusConfig.className}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                    {statusConfig.label}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isPending ? (
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={processing.has(user.id)}
                        className="flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {processing.has(user.id) ? '처리 중...' : '승인'}
                      </button>
                    ) : (
                      <>
                        <button className="flex size-8 items-center justify-center rounded-lg text-[#616f89] hover:bg-gray-100 hover:text-primary transition-colors dark:text-slate-400 dark:hover:bg-slate-700">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button className="flex size-8 items-center justify-center rounded-lg text-[#616f89] hover:bg-gray-100 hover:text-red-500 transition-colors dark:text-slate-400 dark:hover:bg-slate-700">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

