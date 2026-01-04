'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface HeaderProps {
  showSearch?: boolean
  showLogin?: boolean
  glassmorphism?: boolean
  imageUploadButton?: React.ReactNode
  backButton?: React.ReactNode
}

export default function Header({ showSearch = false, showLogin = true, glassmorphism = false, imageUploadButton, backButton }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, loading, signOut } = useAuth()

  // ESC 키로 모바일 메뉴 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <>
      <header className={`flex items-center justify-between whitespace-nowrap border-b border-solid pl-2 pr-6 lg:pl-2 lg:pr-10 py-2 md:py-4 sticky top-0 z-50 ${
        glassmorphism
          ? 'backdrop-blur-xl bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10'
          : 'border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#111318]'
      }`}>
        <div className="flex items-center gap-2 md:gap-8 flex-1">
          {/* 모바일에서 뒤로가기 버튼 (roadview 페이지용) */}
          {backButton && (
            <div className="md:hidden">
              {backButton}
            </div>
          )}
          {/* 모바일에서 로그아웃 버튼을 최 좌측에 배치 (뒤로가기 버튼이 없을 때만) - 로딩 중에는 숨김 */}
          {!loading && !backButton && isAuthenticated && user && (
            <button
              onClick={handleLogout}
              className={`md:hidden flex h-10 px-3 items-center justify-center rounded-lg text-sm font-bold transition-colors ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              로그아웃
            </button>
          )}
          {/* 로그아웃 버튼 (뒤로가기 버튼과 같은 행, 뒤로가기 버튼 다음에 배치) - 로딩 중에는 숨김 */}
          {!loading && backButton && isAuthenticated && user && (
            <button
              onClick={handleLogout}
              className={`md:hidden flex h-10 px-3 items-center justify-center rounded-lg text-sm font-bold transition-colors ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              로그아웃
            </button>
          )}
          <Link href="/" className={`flex items-center gap-2 ${glassmorphism ? 'text-white' : 'text-[#111318] dark:text-white'}`}>
            <h2 className={`text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block ${glassmorphism ? 'text-white' : 'text-[#111318] dark:text-white'}`}>
              Daegu Commercial
            </h2>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/map"
              className={`text-sm font-medium leading-normal transition-colors ${glassmorphism ? 'text-white hover:text-white/80' : 'text-[#111318] dark:text-white hover:text-primary'}`}
            >
              매물 탐색
            </Link>
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
              <>
                <Link
                  href="/admin/properties/new"
                  className={`text-sm font-medium leading-normal transition-colors ${glassmorphism ? 'text-white hover:text-white/80' : 'text-[#111318] dark:text-white hover:text-primary'}`}
                >
                  매물 등록
                </Link>
                <Link
                  href="/admin/users"
                  className={`text-sm font-medium leading-normal transition-colors ${glassmorphism ? 'text-white hover:text-white/80' : 'text-[#111318] dark:text-white hover:text-primary'}`}
                >
                  사용자 관리
                </Link>
                <Link
                  href="/admin/blur"
                  className={`text-sm font-medium leading-normal transition-colors ${glassmorphism ? 'text-white hover:text-white/80' : 'text-[#111318] dark:text-white hover:text-primary'}`}
                >
                  블러 관리
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          {showSearch && (
            <div className="hidden lg:flex w-full max-w-[480px]">
              <label className={`flex w-full items-center gap-4 rounded-lg h-10 px-4 ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800'}`}>
                <span className={`material-symbols-outlined text-[20px] ${glassmorphism ? 'text-white/80' : 'text-[#616f89] dark:text-gray-400'}`}>
                  search
                </span>
                <input
                  placeholder="Search properties..."
                  className={`w-full bg-transparent border-none outline-none text-sm ${glassmorphism ? 'text-white placeholder:text-white/60' : 'text-[#111318] dark:text-white placeholder:text-[#616f89] dark:placeholder:text-gray-500'}`}
                />
              </label>
            </div>
          )}

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {/* Image Upload Button (Mobile only) */}
            {imageUploadButton && (
              <div className="md:hidden">
                {imageUploadButton}
              </div>
            )}
            {/* 데스크톱에서 뒤로가기 버튼 (backButton이 있을 때만) */}
            {backButton && (
              <div className="hidden md:block">
                {backButton}
              </div>
            )}
            {/* 로딩 중일 때는 스켈레톤 표시 */}
            {loading ? (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg animate-pulse ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800'}`}>
                <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-20 h-4 rounded bg-gray-300 dark:bg-gray-600"></div>
              </div>
            ) : isAuthenticated && user ? (
              <>
                {/* User Info */}
                <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${glassmorphism ? 'text-white' : 'text-primary'}`}>
                    person
                  </span>
                  <span className={`text-sm font-medium ${glassmorphism ? 'text-white' : 'text-[#111318] dark:text-white'}`}>
                    {user.full_name || user.email}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${glassmorphism ? 'bg-white/30 text-white' : 'bg-primary/10 text-primary'}`}>
                    {user.tier}
                  </span>
                </div>
                {/* Logout Button - Desktop Only (모바일은 최 좌측에 표시) */}
                <button
                  onClick={handleLogout}
                  className={`hidden md:flex h-10 px-4 items-center justify-center rounded-lg text-sm font-bold transition-colors ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  로그아웃
                </button>
              </>
            ) : (
              showLogin && (
                <Link
                  href="/auth/login"
                  className={`flex h-10 px-6 items-center justify-center rounded-lg text-sm font-bold transition-colors shadow-lg ${glassmorphism ? 'bg-primary border border-primary text-white hover:bg-blue-600' : 'bg-primary text-white hover:bg-blue-600'}`}
                >
                  로그인
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden flex items-center justify-center p-2 rounded transition-colors ${glassmorphism ? 'hover:bg-white/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <span className={`material-symbols-outlined ${glassmorphism ? 'text-white' : 'text-[#111318] dark:text-white'}`}>
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Menu Panel */}
          <div className="fixed top-[57px] md:top-[73px] right-0 w-[280px] h-[calc(100vh-57px)] md:h-[calc(100vh-73px)] bg-white dark:bg-[#111318] border-l border-[#f0f2f4] dark:border-gray-800 z-50 md:hidden overflow-y-auto">
            <nav className="flex flex-col p-4 gap-2">
              {/* User Info (Mobile) */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800">
                  <span className="material-symbols-outlined text-primary text-[28px]">
                    account_circle
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#111318] dark:text-white">
                      {user.full_name || user.email}
                    </span>
                    <span className="text-xs text-[#616f89] dark:text-gray-400">
                      {user.tier} 등급
                    </span>
                  </div>
                </div>
              )}

              <Link
                href="/map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-primary">map</span>
                <span className="text-[#111318] dark:text-white font-medium">매물 탐색</span>
              </Link>

              {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
                <>
                  <Link
                    href="/admin/properties/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary">add_circle</span>
                    <span className="text-[#111318] dark:text-white font-medium">매물 등록</span>
                  </Link>

                  <Link
                    href="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f0f2f4] dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary">group</span>
                    <span className="text-[#111318] dark:text-white font-medium">
                      사용자 관리
                    </span>
                  </Link>
                </>
              )}

              <div className="my-4 border-t border-[#f0f2f4] dark:border-gray-800"></div>

              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span className="font-medium">로그아웃</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-white hover:bg-blue-600 transition-colors"
                >
                  <span className="material-symbols-outlined">login</span>
                  <span className="font-medium">로그인</span>
                </Link>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
