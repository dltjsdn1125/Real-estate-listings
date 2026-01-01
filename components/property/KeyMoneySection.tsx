'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { hasPermission } from '@/lib/auth/permissions'
import Link from 'next/link'

interface KeyMoneySectionProps {
  keyMoney: string
}

export default function KeyMoneySection({ keyMoney }: KeyMoneySectionProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const canViewKeyMoney = hasPermission(user, 'VIEW_KEY_MONEY')

  if (loading) {
    return (
      <div className="flex flex-col gap-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-yellow-400 dark:bg-yellow-500 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[24px]">payments</span>
        </div>
        <h3 className="text-xl font-bold text-[#111318] dark:text-white">Key Money (권리금)</h3>
      </div>

      <div className="relative">
        {canViewKeyMoney ? (
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-500">
              {keyMoney}
            </span>
            <span className="text-lg text-yellow-600/70 dark:text-yellow-500/70">만원</span>
          </div>
        ) : (
          <>
            {/* Blurred Content */}
            <div className="relative">
              <div className="blur-md select-none pointer-events-none">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-500">
                    ₩1,500
                  </span>
                  <span className="text-lg text-yellow-600/70 dark:text-yellow-500/70">만원</span>
                </div>
              </div>

              {/* Unlock Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm rounded-lg">
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
                      className="inline-block mt-2 text-primary hover:underline text-sm font-medium"
                    >
                      등급 업그레이드
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
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
        <div className="flex items-center justify-between text-sm">
          <span className="text-yellow-700/70 dark:text-yellow-600/70">협의 가능</span>
          <span className="text-yellow-700 dark:text-yellow-600 font-medium">Yes</span>
        </div>
        <p className="text-xs text-yellow-700/70 dark:text-yellow-600/70">
          * Key money is subject to change based on market conditions.
        </p>
      </div>
    </div>
  )
}
