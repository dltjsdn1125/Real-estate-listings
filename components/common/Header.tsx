'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface HeaderProps {
  showSearch?: boolean
  showLogin?: boolean
  glassmorphism?: boolean
}

export default function Header({ showSearch = false, showLogin = true, glassmorphism = false }: HeaderProps) {
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
      <header className={`flex items-center justify-between whitespace-nowrap border-b border-solid px-6 lg:px-10 py-4 sticky top-0 z-50 ${
        glassmorphism
          ? 'backdrop-blur-xl bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10'
          : 'border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#111318]'
      }`}>
        <div className="flex items-center gap-8">
          <Link href="/" className={`flex items-center gap-2 ${glassmorphism ? 'text-white' : 'text-[#111318] dark:text-white'}`}>
            <div className={`size-8 ${glassmorphism ? 'text-white' : 'text-primary'}`}>
              <svg
                className="w-full h-full"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </div>
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
            {loading ? (
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className={`flex h-10 px-4 items-center justify-center rounded-lg text-sm font-bold transition-colors ${glassmorphism ? 'backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30' : 'bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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
          <div className="fixed top-[73px] right-0 w-[280px] h-[calc(100vh-73px)] bg-white dark:bg-[#111318] border-l border-[#f0f2f4] dark:border-gray-800 z-50 md:hidden overflow-y-auto">
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
