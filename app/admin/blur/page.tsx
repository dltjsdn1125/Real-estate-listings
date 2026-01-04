'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { getProperties } from '@/lib/supabase/properties'
import { updateProperty } from '@/lib/supabase/properties'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import type { Property } from '@/lib/supabase/types'

export default function BlurManagementPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'blurred' | 'not_blurred'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processing, setProcessing] = useState<Set<string>>(new Set())

  // 권한 체크
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        window.location.href = '/auth/login'
        return
      }
      if (user && !['admin', 'agent'].includes(user.role)) {
        window.location.href = '/'
        return
      }
    }
  }, [authLoading, isAuthenticated, user])

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await getProperties({ limit: 1000 })
      
      if (error) throw error
      
      if (data) {
        setProperties(data)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'agent')) {
      loadProperties()
    }
  }, [isAuthenticated, user, loadProperties])

  const handleToggleBlur = async (propertyId: string, currentBlurred: boolean) => {
    setProcessing((prev) => new Set(prev).add(propertyId))
    try {
      await updateProperty(propertyId, { is_blurred: !currentBlurred })
      await loadProperties()
    } catch (error) {
      console.error('Error toggling blur:', error)
      alert('블러 처리 변경 중 오류가 발생했습니다.')
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev)
        next.delete(propertyId)
        return next
      })
    }
  }

  const filteredProperties = properties.filter((property) => {
    // 필터 적용
    if (filter === 'blurred' && !property.is_blurred) return false
    if (filter === 'not_blurred' && property.is_blurred) return false
    
    // 검색어 적용
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        property.title.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.district?.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: 'Blur Management' },
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <AdminHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-[#616f89] dark:text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-[#111318] dark:text-white mb-6">블러 관리</h1>
          
          {/* 필터 및 검색 */}
          <div className="bg-white dark:bg-[#151c2b] rounded-xl p-6 mb-6 shadow-sm border border-[#f0f2f4] dark:border-gray-800">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 필터 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setFilter('blurred')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'blurred'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  블러 처리됨
                </button>
                <button
                  onClick={() => setFilter('not_blurred')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'not_blurred'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  블러 처리 안됨
                </button>
              </div>
              
              {/* 검색 */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="매물 제목, 주소, 지역으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* 매물 목록 */}
          <div className="bg-white dark:bg-[#151c2b] rounded-xl shadow-sm border border-[#f0f2f4] dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-gray-400">
                      매물 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-gray-400">
                      주소
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-gray-400">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-gray-400">
                      블러 처리
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#616f89] dark:text-gray-400">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProperties.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#616f89] dark:text-gray-400">
                        {loading ? '로딩 중...' : '매물이 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    filteredProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-[#111318] dark:text-white">
                            {property.title}
                          </div>
                          <div className="text-xs text-[#616f89] dark:text-gray-400 mt-1">
                            {property.property_type} · {property.transaction_type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#111318] dark:text-white">
                            {property.address}
                          </div>
                          <div className="text-xs text-[#616f89] dark:text-gray-400">
                            {property.district} {property.dong}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            property.status === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {property.status === 'available' ? '판매중' : property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            property.is_blurred
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {property.is_blurred ? '블러 처리됨' : '정상'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleBlur(property.id, property.is_blurred || false)}
                            disabled={processing.has(property.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              property.is_blurred
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {processing.has(property.id)
                              ? '처리 중...'
                              : property.is_blurred
                              ? '블러 해제'
                              : '블러 처리'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

