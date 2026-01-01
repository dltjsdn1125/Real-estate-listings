'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import UserStats from '@/components/admin/UserStats'
import UserTable from '@/components/admin/UserTable'
import { getUsers, getUserStats } from '@/lib/supabase/users'
import { useAuth } from '@/lib/hooks/useAuth'
import type { User } from '@/lib/supabase/types'

export default function UsersPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    premium: 0,
    admin: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'tier'>('all')
  const [filters, setFilters] = useState({
    tier: 'all',
    status: 'all',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // 권한 체크
  useEffect(() => {
    console.log('🔐 UsersPage - Auth Check:', {
      authLoading,
      isAuthenticated,
      userRole: user?.role,
      userEmail: user?.email,
      hasAccess: user ? ['admin', 'agent'].includes(user.role) : false
    })

    if (!authLoading) {
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login')
        router.push('/auth/login')
        return
      }
      if (user && !['admin', 'agent'].includes(user.role)) {
        console.log('❌ Not admin/agent, redirecting to home. Role:', user.role)
        router.push('/')
        return
      }
      console.log('✅ Access granted')
    }
  }, [authLoading, isAuthenticated, user, router])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      // 탭에 따른 기본 필터 설정
      let approvalStatus = filters.status !== 'all' ? filters.status : undefined
      if (activeTab === 'pending') {
        approvalStatus = 'pending'
      }
      
      const [usersData, statsData] = await Promise.all([
        getUsers({
          tier: filters.tier !== 'all' ? filters.tier : undefined,
          approvalStatus,
          search: filters.search || undefined,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
        }),
        getUserStats(),
      ])

      if (usersData.data) {
        setUsers(usersData.data)
      }
      setStats(statsData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, itemsPerPage, activeTab])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }))
    setCurrentPage(1)
  }

  const handleTabChange = (tab: 'all' | 'pending' | 'tier') => {
    setActiveTab(tab)
    setCurrentPage(1)
    // 탭 변경 시 필터 초기화
    if (tab === 'pending') {
      setFilters({ tier: 'all', status: 'pending', search: '' })
    } else if (tab === 'tier') {
      setFilters({ tier: 'all', status: 'all', search: '' })
    } else {
      setFilters({ tier: 'all', status: 'all', search: '' })
    }
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'User Management' },
  ]

  const totalPages = Math.ceil(stats.total / itemsPerPage)

  // 권한 체크 중이면 로딩 표시
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-[#616f89] dark:text-gray-400">권한 확인 중...</p>
        </div>
      </div>
    )
  }

  // 로딩 완료 후 권한 없으면 리다이렉트 (렌더링 안 함)
  if (!isAuthenticated || (user && !['admin', 'agent'].includes(user.role))) {
    return null
  }

  return (
    <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark">
      <AdminHeader title="Daegu Admin" />
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-background-light dark:bg-background-dark relative">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#f0f2f4] bg-white dark:bg-[#1e293b] dark:border-[#334155] px-6 shrink-0 z-20">
          {/* Left Side: Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-8 text-primary">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#111318] dark:text-white hidden sm:block">Daegu Admin</h2>
            </Link>
          </div>

          {/* Right Side: User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-slate-700">
                <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                <span className="text-sm font-medium text-[#111318] dark:text-white">{user.full_name || user.email}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">{user.tier}</span>
              </div>
            )}
            {/* Logout Button */}
            <button
              onClick={async () => {
                const { signOut } = await import('@/lib/hooks/useAuth')
                await signOut()
                window.location.href = '/'
              }}
              className="flex h-10 px-4 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors bg-[#f0f2f4] dark:bg-slate-700 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </header>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
            {/* Page Heading & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-[#111318] dark:text-white">
                  사용자 관리
                </h1>
                <p className="text-base text-[#616f89] dark:text-slate-400">
                  사용자 계정 상태 모니터링 및 등급/권한 승인 관리
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/map"
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#dbdfe6] bg-white px-4 py-2.5 text-sm font-bold text-[#111318] hover:bg-gray-50 transition-colors dark:bg-[#1e293b] dark:border-[#334155] dark:text-white dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-[20px]">map</span>
                  <span>지도로 이동</span>
                </Link>
                <Link
                  href="/admin/properties/new"
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>매물 등록</span>
                </Link>
              </div>
            </div>
            {/* Stats Cards */}
            <UserStats
              total={stats.total}
              pending={stats.pending}
              premium={stats.premium}
              admin={stats.admin}
              totalChange="+12% 지난달 대비"
              pendingChange={`+5 신규 요청`}
            />
            {/* Main Content Card */}
            <div className="flex flex-col rounded-xl border border-[#dbdfe6] bg-white shadow-sm dark:bg-[#1e293b] dark:border-[#334155] overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-[#f0f2f4] px-6 dark:border-[#334155]">
                <button
                  onClick={() => handleTabChange('all')}
                  className={`border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'all'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-[#616f89] hover:text-[#111318] dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  전체 사용자
                </button>
                <button
                  onClick={() => handleTabChange('pending')}
                  className={`border-b-2 px-4 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === 'pending'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-[#616f89] hover:text-[#111318] dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  권한 승인 대기{' '}
                  {stats.pending > 0 && (
                    <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-700 dark:bg-red-900 dark:text-red-200">
                      {stats.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('tier')}
                  className={`border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'tier'
                      ? 'border-primary text-primary font-bold'
                      : 'border-transparent text-[#616f89] hover:text-[#111318] dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  등급 설정
                </button>
              </div>
              {/* Filters Toolbar */}
              <div className="flex flex-col gap-4 border-b border-[#f0f2f4] p-4 lg:flex-row lg:items-center lg:justify-between dark:border-[#334155]">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616f89] dark:text-slate-400">
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </span>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearch}
                    placeholder="이름, 이메일, 전화번호 검색"
                    className="h-10 w-full rounded-lg border-none bg-[#f0f2f4] pl-10 pr-4 text-sm font-medium text-[#111318] placeholder-[#616f89] focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {activeTab !== 'tier' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#616f89] dark:text-slate-400">
                        필터:
                      </span>
                      <select
                        value={filters.tier}
                        onChange={(e) => handleFilterChange('tier', e.target.value)}
                        className="h-9 rounded-lg border border-[#dbdfe6] bg-white px-3 py-1 text-sm font-medium text-[#111318] focus:border-primary focus:ring-1 focus:ring-primary dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                      >
                        <option value="all">모든 등급</option>
                        <option value="bronze">일반 회원</option>
                        <option value="agent">공인중개사</option>
                        <option value="premium">프리미엄</option>
                      </select>
                      {activeTab === 'all' && (
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="h-9 rounded-lg border border-[#dbdfe6] bg-white px-3 py-1 text-sm font-medium text-[#111318] focus:border-primary focus:ring-1 focus:ring-primary dark:bg-[#1e293b] dark:border-[#334155] dark:text-white"
                        >
                          <option value="all">모든 상태</option>
                          <option value="approved">활성 (Active)</option>
                          <option value="pending">대기 (Pending)</option>
                          <option value="rejected">거부 (Rejected)</option>
                        </select>
                      )}
                    </div>
                  )}
                  <button
                    onClick={loadUsers}
                    disabled={loading}
                    className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#dbdfe6] bg-white px-3 text-sm font-bold text-[#111318] hover:bg-gray-50 disabled:opacity-50 dark:bg-[#1e293b] dark:border-[#334155] dark:text-white dark:hover:bg-slate-700"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    새로고침
                  </button>
                </div>
              </div>
              {/* Data Table */}
              {loading ? (
                <div className="p-12 text-center text-[#616f89] dark:text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  로딩 중...
                </div>
              ) : activeTab === 'tier' ? (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-[#111318] dark:text-white mb-2">등급 설정</h3>
                    <p className="text-sm text-[#616f89] dark:text-slate-400">
                      사용자의 등급을 변경할 수 있습니다. 등급에 따라 접근 권한이 달라집니다.
                    </p>
                  </div>
                  <UserTable users={users} onUserUpdate={loadUsers} showTierEdit={true} />
                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-[#f0f2f4] bg-white px-6 py-4 dark:bg-[#1e293b] dark:border-[#334155]">
                    <p className="text-sm text-[#616f89] dark:text-slate-400">
                      Showing{' '}
                      <span className="font-bold text-[#111318] dark:text-white">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-bold text-[#111318] dark:text-white">
                        {Math.min(currentPage * itemsPerPage, stats.total)}
                      </span>{' '}
                      of <span className="font-bold text-[#111318] dark:text-white">{stats.total}</span>{' '}
                      users
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-[#616f89] hover:bg-gray-50 disabled:opacity-50 dark:bg-[#1e293b] dark:border-[#334155] dark:text-slate-400"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-sm font-bold dark:bg-[#1e293b] dark:border-[#334155] ${
                              currentPage === pageNum
                                ? 'bg-primary text-white border-primary'
                                : 'text-[#111318] hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <span className="text-[#616f89] px-1 dark:text-slate-500">...</span>
                      )}
                      {totalPages > 5 && (
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-[#111318] hover:bg-gray-50 text-sm font-bold dark:bg-[#1e293b] dark:border-[#334155] dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {totalPages}
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-[#616f89] hover:bg-gray-50 dark:bg-[#1e293b] dark:border-[#334155] dark:text-slate-400"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <UserTable users={users} onUserUpdate={loadUsers} />
                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-[#f0f2f4] bg-white px-6 py-4 dark:bg-[#1e293b] dark:border-[#334155]">
                    <p className="text-sm text-[#616f89] dark:text-slate-400">
                      Showing{' '}
                      <span className="font-bold text-[#111318] dark:text-white">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-bold text-[#111318] dark:text-white">
                        {Math.min(currentPage * itemsPerPage, stats.total)}
                      </span>{' '}
                      of <span className="font-bold text-[#111318] dark:text-white">{stats.total}</span>{' '}
                      users
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-[#616f89] hover:bg-gray-50 disabled:opacity-50 dark:bg-[#1e293b] dark:border-[#334155] dark:text-slate-400"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-sm font-bold dark:bg-[#1e293b] dark:border-[#334155] ${
                              currentPage === pageNum
                                ? 'bg-primary text-white border-primary'
                                : 'text-[#111318] hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <span className="text-[#616f89] px-1 dark:text-slate-500">...</span>
                      )}
                      {totalPages > 5 && (
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-[#111318] hover:bg-gray-50 text-sm font-bold dark:bg-[#1e293b] dark:border-[#334155] dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {totalPages}
                        </button>
                      )}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex size-8 items-center justify-center rounded-lg border border-[#dbdfe6] bg-white text-[#616f89] hover:bg-gray-50 dark:bg-[#1e293b] dark:border-[#334155] dark:text-slate-400"
                      >
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

