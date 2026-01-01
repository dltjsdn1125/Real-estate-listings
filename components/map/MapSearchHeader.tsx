'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface MapSearchHeaderProps {
  onToggleSidebar?: () => void
}

export default function MapSearchHeader({ onToggleSidebar }: MapSearchHeaderProps) {
  const { user, isAuthenticated, loading, signOut } = useAuth()

  // 디버깅용
  console.log('🔍 MapSearchHeader - Auth State:', {
    isAuthenticated,
    loading,
    user: user ? { email: user.email, role: user.role, tier: user.tier } : null
  })

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-solid border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#101622] px-6 lg:px-10 py-3 z-30">
      <div className="flex items-center gap-4 text-[#111318] dark:text-white">
        {/* Mobile: 사이드바 토글 버튼 */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden flex items-center justify-center size-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111318] dark:text-white transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="size-8 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">real_estate_agent</span>
          </div>
          <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            Daegu Realty
          </h2>
        </Link>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors">
            홈
          </Link>
          <Link href="/map" className="text-primary text-sm font-bold leading-normal">
            매물 탐색
          </Link>
          {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
            <>
              <Link
                href="/admin/properties/new"
                className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
              >
                매물 등록
              </Link>
              <Link
                href="/admin/users"
                className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
              >
                사용자 관리
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <>
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  person
                </span>
                <span className="text-sm font-medium text-[#111318] dark:text-white">
                  {user.full_name || user.email}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">
                  {user.tier}
                </span>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex h-10 px-4 items-center justify-center rounded-lg text-sm font-bold transition-colors bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex h-10 px-4 items-center justify-center rounded-lg text-sm font-bold transition-colors bg-primary text-white hover:bg-blue-600"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

