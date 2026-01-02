'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface MapSearchHeaderProps {
  onToggleSidebar?: () => void
  onQuickRegister?: () => void
}

export default function MapSearchHeader({ onToggleSidebar, onQuickRegister }: MapSearchHeaderProps) {
  const { user, isAuthenticated, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 개발 환경에서만 디버깅 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 MapSearchHeader - Auth State:', {
      isAuthenticated,
      loading,
      user: user ? { email: user.email, role: user.role, tier: user.tier } : null
    })
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <>
      <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-solid border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#101622] px-4 lg:px-10 py-3 z-30">
        <div className="flex items-center gap-2 text-[#111318] dark:text-white">
          {/* Mobile: 사이드바 토글 버튼 */}
          <button
            onClick={onToggleSidebar}
            className="md:hidden flex items-center justify-center size-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111318] dark:text-white transition-colors"
          >
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">real_estate_agent</span>
            </div>
            <h2 className="text-[#111318] dark:text-white text-base lg:text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block">
              Daegu Realty
            </h2>
          </Link>
        </div>
        <div className="flex flex-1 justify-end gap-4 lg:gap-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors">
              홈
            </Link>
            <Link href="/map" className="text-primary text-sm font-bold leading-normal">
              매물 탐색
            </Link>
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
              <>
                <button
                  onClick={onQuickRegister}
                  className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
                >
                  간단 등록
                </button>
                <Link
                  href="/admin/properties/new"
                  className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
                >
                  상세 등록
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
                  >
                    사용자 관리
                  </Link>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                {/* User Info - Desktop Only */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800">
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
                {/* Logout Button - Desktop Only */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex h-10 px-4 items-center justify-center rounded-lg text-sm font-bold transition-colors bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
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
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center size-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111318] dark:text-white transition-colors"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? 'close' : 'more_vert'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-[60px] right-2 w-56 bg-white dark:bg-[#1c2333] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 md:hidden overflow-hidden">
            {/* User Info */}
            {isAuthenticated && user && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">account_circle</span>
                  <div>
                    <p className="text-sm font-medium text-[#111318] dark:text-white truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.tier} 등급</p>
                  </div>
                </div>
              </div>
            )}

            <nav className="py-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                <span className="text-sm font-medium">홈</span>
              </Link>
              <Link
                href="/map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/5"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                <span className="text-sm font-bold">매물 탐색</span>
              </Link>

              {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
                <>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      onQuickRegister?.()
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span className="text-sm font-medium">간단 등록</span>
                  </button>
                  <Link
                    href="/admin/properties/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    <span className="text-sm font-medium">상세 등록</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="material-symbols-outlined text-[20px]">group</span>
                      <span className="text-sm font-medium">사용자 관리</span>
                    </Link>
                  )}
                </>
              )}

              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span className="text-sm font-medium">로그아웃</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-primary/5"
                >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span className="text-sm font-medium">로그인</span>
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}

