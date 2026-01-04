'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { hasPermission } from '@/lib/auth/permissions'
import { updateProperty } from '@/lib/supabase/properties'
import Link from 'next/link'

interface KeyMoneySectionProps {
  keyMoney: string
  propertyId?: string
  propertyOwnerId?: string
  onUpdate?: () => void
}

export default function KeyMoneySection({ keyMoney, propertyId, propertyOwnerId, onUpdate }: KeyMoneySectionProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const canViewKeyMoney = hasPermission(user, 'VIEW_KEY_MONEY')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // 수정 권한 확인 (매물 소유자 또는 admin/agent)
  const canEdit = propertyId && user && (
    user.role === 'admin' || 
    user.role === 'agent' || 
    (propertyOwnerId && propertyOwnerId === user.id)
  )

  // keyMoney를 만원 단위로 변환 (DB에는 원 단위로 저장됨)
  // keyMoney 형식: "6,000만 (보증금)" 또는 "0 (매매)" 등
  const extractNumber = (str: string) => {
    const match = str.match(/([\d,]+)/)
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0
  }
  const keyMoneyInManwon = keyMoney ? extractNumber(keyMoney).toString() : '0'

  const handleSave = async () => {
    if (!propertyId || !canEdit) return

    const value = parseFloat(editValue)
    if (isNaN(value) || value < 0) {
      alert('올바른 금액을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      // 만원 단위를 원 단위로 변환하여 저장
      await updateProperty(propertyId, {
        key_money: value * 10000,
      })
      
      setIsEditing(false)
      onUpdate?.() // 부모 컴포넌트에 업데이트 알림
    } catch (error: any) {
      console.error('권리금 업데이트 오류:', error)
      alert('권리금 업데이트 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
  }

  // 로딩 중이거나 인증 상태가 불확실할 때는 로딩 UI 표시
  if (loading) {
    return (
      <div className="flex flex-col gap-4 bg-transparent border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  // 로딩이 완료된 후에만 권한 체크 및 UI 표시
  // isAuthenticated가 true인데 canViewKeyMoney가 false인 경우 = 등급 부족
  // isAuthenticated가 false인 경우 = 로그인 필요

  return (
    <div className="flex flex-col gap-4 bg-transparent border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-yellow-400 dark:bg-yellow-500 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[24px]">payments</span>
        </div>
        <h3 className="text-lg md:text-xl font-bold text-[#111318] dark:text-white">Key Money (권리금)</h3>
      </div>

      <div className="relative">
        {canViewKeyMoney ? (
          <div className="flex flex-col gap-3">
            {isEditing ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-500 bg-transparent border-b-2 border-yellow-400 dark:border-yellow-500 focus:outline-none focus:border-yellow-600 dark:focus:border-yellow-400 w-24 md:w-32"
                    placeholder="0"
                    autoFocus
                  />
                  <span className="text-base md:text-lg text-yellow-600/70 dark:text-yellow-500/70 whitespace-nowrap">만원</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                        <span>저장 중...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>저장</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                  {keyMoneyInManwon}
                </span>
                <span className="text-base md:text-lg text-yellow-600/70 dark:text-yellow-500/70 whitespace-nowrap">만원</span>
                {canEdit && (
                  <button
                    onClick={() => {
                      setEditValue(keyMoneyInManwon)
                      setIsEditing(true)
                    }}
                    className="ml-2 p-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                    title="권리금 수정"
                  >
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500 text-[20px]">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Blurred Content */}
            <div className="relative">
              <div className="blur-md select-none pointer-events-none">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-yellow-600 dark:text-yellow-500">
                    ₩1,500
                  </span>
                  <span className="text-base md:text-lg text-yellow-600/70 dark:text-yellow-500/70">만원</span>
                </div>
              </div>

              {/* Unlock Overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                {isAuthenticated ? (
                  <div className="text-center px-4">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-500 text-5xl mb-2">
                      lock
                    </span>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-600">
                      Silver 등급 이상 필요
                    </p>
                    <Link
                      href="/pricing"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block mt-2 text-primary hover:underline text-sm font-medium"
                    >
                      등급 업그레이드
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors shadow-lg"
                  >
                    <span className="material-symbols-outlined">lock_open</span>
                    <span>로그인하여 보기</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Info Message */}
            <p className="text-sm text-yellow-700 dark:text-yellow-600 flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>
                {isAuthenticated
                  ? '권리금 정보는 Silver 등급 이상 회원에게 제공됩니다.'
                  : '권리금 정보는 인증된 회원에게만 제공됩니다.'}
              </span>
            </p>
          </>
        )}
      </div>

      {/* Additional Info */}
      <div className="flex flex-col gap-2 pt-4 border-t border-yellow-200 dark:border-yellow-800/30">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <span className="text-yellow-700/70 dark:text-yellow-600/70">협의 가능</span>
          <span className="text-yellow-700 dark:text-yellow-600 font-medium">Yes</span>
        </div>
        <p className="text-[10px] md:text-xs text-yellow-700/70 dark:text-yellow-600/70">
          * Key money is subject to change based on market conditions.
        </p>
      </div>
    </div>
  )
}
