'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface MapSearchHeaderProps {
  onToggleSidebar?: () => void
  onQuickRegister?: () => void
  onPinIt?: () => void
  pinItMode?: boolean
  onSearch?: (keyword: string) => void
}

export default function MapSearchHeader({
  onToggleSidebar,
  onQuickRegister,
  onPinIt,
  pinItMode = false,
  onSearch,
}: MapSearchHeaderProps) {
  const router = useRouter()
  const { user, isAuthenticated, loading, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchQuery, setMobileSearchQuery] = useState('')
  
  const prevAuthState = useRef<{ isAuthenticated: boolean; loading: boolean; userId: string | null }>({
    isAuthenticated: false,
    loading: true,
    userId: null
  })

  // Pin it 버튼 표시 여부 계산
  const canShowPinIt = isAuthenticated && user && (
    (user.tier && ['bronze', 'silver', 'gold', 'platinum', 'premium'].includes(user.tier)) ||
    user.role === 'admin' ||
    user.role === 'agent'
  )

  // 개발 환경에서만 디버깅 로그 출력 (상태 변경 시에만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const currentState = {
        isAuthenticated,
        loading,
        userId: user?.id || null
      }
      
      // 상태가 변경되었을 때만 로그 출력
      if (
        prevAuthState.current.isAuthenticated !== currentState.isAuthenticated ||
        prevAuthState.current.loading !== currentState.loading ||
        prevAuthState.current.userId !== currentState.userId
      ) {
        console.log('🔍 MapSearchHeader - Auth State:', {
          isAuthenticated,
          loading,
          user: user ? { email: user.email, role: user.role, tier: user.tier } : null,
          canShowPinIt
        })
        prevAuthState.current = currentState
      }
    }
  }, [isAuthenticated, loading, user, canShowPinIt])

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <>
      <header className="flex shrink-0 items-center justify-between whitespace-nowrap border-b border-solid border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#101622] px-4 lg:px-10 py-3 z-30">
        <div className="flex items-center gap-2 text-[#111318] dark:text-white">
          {/* 필터 사이드바 토글 버튼 */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center justify-center size-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-[#111318] dark:text-white transition-colors"
            title="필터"
          >
            <span className="material-symbols-outlined">filter_list</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              console.log('로고 클릭')
              window.location.href = '/'
            }}
            className="flex items-center gap-2"
          >
            <div className="size-8 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">real_estate_agent</span>
            </div>
            <h2 className="text-[#111318] dark:text-white text-base lg:text-lg font-bold leading-tight tracking-[-0.015em] hidden sm:block">
              Daegu Realty
            </h2>
          </button>
        </div>
        <div className="flex flex-1 justify-end gap-4 lg:gap-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                console.log('홈 버튼 클릭')
                window.location.href = '/'
              }}
              className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
            >
              홈
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                console.log('매물 탐색 버튼 클릭')
                window.location.href = '/map'
              }}
              className="text-primary text-sm font-bold leading-normal"
            >
              매물 탐색
            </button>
            {/* 일반 회원 이상 또는 Admin/Agent: 간단 등록 및 Pin it */}
            {canShowPinIt && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onQuickRegister?.()
                  }}
                  className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
                >
                  간단 등록
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    onPinIt?.()
                  }}
                  className={`text-sm font-medium leading-normal transition-colors ${
                    pinItMode
                      ? 'text-primary font-bold'
                      : 'text-[#111318] dark:text-gray-300 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] align-middle mr-1">
                    {pinItMode ? 'push_pin' : 'push_pin'}
                  </span>
                  Pin it
                </button>
              </>
            )}
            {/* Admin/Agent: 상세 등록 */}
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  console.log('상세 등록 버튼 클릭 - 바로 이동', { isAuthenticated, userRole: user?.role })
                  // useAuth에서 이미 인증 확인됨, 바로 이동
                  window.location.href = '/admin/properties/new'
                }}
                className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
              >
                상세 등록
              </button>
            )}
            {/* Admin: 사용자 관리 */}
            {isAuthenticated && user?.role === 'admin' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  console.log('사용자 관리 버튼 클릭 - 바로 이동', { isAuthenticated, userRole: user?.role })
                  // useAuth에서 이미 인증 확인됨, 바로 이동
                  window.location.href = '/admin/users'
                }}
                className="text-[#111318] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary transition-colors"
              >
                사용자 관리
              </button>
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
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setMobileMenuOpen(false)
                  console.log('홈 버튼 클릭 (모바일)')
                  window.location.href = '/'
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="material-symbols-outlined text-[20px]">home</span>
                <span className="text-sm font-medium">홈</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setMobileMenuOpen(false)
                  console.log('매물 탐색 버튼 클릭 (모바일)')
                  window.location.href = '/map'
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-primary bg-primary/5"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                <span className="text-sm font-bold">매물 탐색</span>
              </button>

              {/* 일반 회원 이상 또는 Admin/Agent: 간단 등록 및 Pin it */}
              {canShowPinIt && (
                <>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setMobileMenuOpen(false)
                      onQuickRegister?.()
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span className="text-sm font-medium">간단 등록</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      setMobileMenuOpen(false)
                      onPinIt?.()
                    }}
                    className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      pinItMode
                        ? 'text-primary font-bold bg-primary/10 dark:bg-primary/20'
                        : 'text-[#111318] dark:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">push_pin</span>
                    <span className="text-sm font-medium">Pin it</span>
                  </button>
                </>
              )}
              {/* Admin/Agent: 상세 등록 */}
              {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setMobileMenuOpen(false)
                    console.log('상세 등록 버튼 클릭 (모바일) - 바로 이동')
                    window.location.href = '/admin/properties/new'
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  <span className="text-sm font-medium">상세 등록</span>
                </button>
              )}
              {/* Admin: 사용자 관리 */}
              {isAuthenticated && user?.role === 'admin' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setMobileMenuOpen(false)
                    console.log('사용자 관리 버튼 클릭 (모바일) - 바로 이동')
                    window.location.href = '/admin/users'
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-[#111318] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="material-symbols-outlined text-[20px]">group</span>
                  <span className="text-sm font-medium">사용자 관리</span>
                </button>
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

