'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import type { Property, PropertyImage } from '@/lib/supabase/types'

export default function PropertyListPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [properties, setProperties] = useState<(Property & { property_images?: PropertyImage[]; creator?: { full_name: string; email: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'available' | 'sold' | 'pending' | 'hidden'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<Set<string>>(new Set())

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
      // admin/agent는 모든 매물 조회 가능 (is_public 무시)
      // DB에서 키워드 필터링하지 않고 모든 매물 가져온 후 클라이언트에서 필터링 (원래 구조)
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(*),
          creator:users!properties_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (error) throw error
      
      if (data) {
        setProperties(data)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
      alert('매물 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'agent')) {
      loadProperties()
    }
  }, [isAuthenticated, user, loadProperties])

  const handleDelete = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`"${propertyTitle}" 매물을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    setDeleting((prev) => new Set(prev).add(propertyId))
    try {
      // MCP Supabase를 사용하여 삭제
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId)

      if (error) throw error

      // 목록에서 제거
      setProperties((prev) => prev.filter((p) => p.id !== propertyId))
      alert('매물이 삭제되었습니다.')
    } catch (error: any) {
      console.error('Error deleting property:', error)
      if (error?.message?.includes('permission') || error?.message?.includes('policy')) {
        alert('삭제 권한이 없습니다. 관리자 권한이 필요합니다.')
      } else {
        alert('매물 삭제 중 오류가 발생했습니다.')
      }
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev)
        next.delete(propertyId)
        return next
      })
    }
  }

  const filteredProperties = properties.filter((property) => {
    // 필터 적용
    if (filter !== 'all' && property.status !== filter) return false
    
    // 검색어 적용 (클라이언트 측 필터링)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        property.title?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.district?.toLowerCase().includes(query) ||
        property.dong?.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const formatPrice = (property: Property) => {
    if (property.transaction_type === 'sale') {
      return property.sale_price ? `${Number(property.sale_price).toLocaleString()}원` : '가격 미정'
    } else if (property.transaction_type === 'rent_monthly') {
      const deposit = property.deposit ? `${Number(property.deposit).toLocaleString()}만원` : '0만원'
      const rent = property.monthly_rent ? `${Number(property.monthly_rent).toLocaleString()}만원` : '0만원'
      return `${deposit} / ${rent}`
    } else if (property.transaction_type === 'rent_yearly') {
      const deposit = property.deposit ? `${Number(property.deposit).toLocaleString()}만원` : '0만원'
      const rent = property.yearly_rent ? `${Number(property.yearly_rent).toLocaleString()}만원` : '0만원'
      return `${deposit} / ${rent}`
    } else {
      const keyMoney = property.key_money ? `${Number(property.key_money).toLocaleString()}만원` : '0만원'
      return keyMoney
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      available: { label: '거래가능', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600' },
      sold: { label: '거래완료', className: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700' },
      pending: { label: '거래중', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600' },
      hidden: { label: '숨김', className: 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-500 border border-gray-200 dark:border-gray-700' },
    }
    const config = statusConfig[status] || statusConfig.available
    return (
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-sm uppercase tracking-wide ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: '매물 목록' },
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-gray-300 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">매물 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <AdminHeader />
      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-10 max-w-7xl">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
              매물 목록
            </h1>
            <Link
              href="/admin/properties/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-900 dark:border-gray-50"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              새 매물 등록
            </Link>
          </div>

          {/* 필터 및 검색 */}
          <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 필터 */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'available', 'sold', 'pending', 'hidden'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors border ${
                      filter === filterOption
                        ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 border-gray-900 dark:border-gray-50'
                        : 'bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    {filterOption === 'all' ? '전체' : 
                     filterOption === 'available' ? '거래가능' :
                     filterOption === 'sold' ? '거래완료' :
                     filterOption === 'pending' ? '거래중' : '숨김'}
                  </button>
                ))}
              </div>

              {/* 검색 */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="제목, 주소, 구/동으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 매물 목록 */}
          <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-gray-800 overflow-hidden">
            {filteredProperties.length === 0 ? (
              <div className="p-12 sm:p-16 text-center">
                <span className="material-symbols-outlined text-5xl sm:text-6xl text-gray-300 dark:text-gray-700 mb-4 block">
                  real_estate_agent
                </span>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 font-medium">
                  {searchQuery || filter !== 'all' 
                    ? '검색 결과가 없습니다.' 
                    : '등록된 매물이 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProperties.map((property) => {
                  // 이미지가 실제로 업로드된 경우에만 표시
                  const propertyImages = property.property_images as any[] | undefined
                  const hasImages = propertyImages && Array.isArray(propertyImages) && propertyImages.length > 0
                  const mainImage = hasImages
                    ? propertyImages.find((img: any) => img.is_main && img.image_url) || 
                      propertyImages.find((img: any) => img.image_url)
                    : null
                  
                  return (
                    <div
                      key={property.id}
                      className="p-5 sm:p-6 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors border-l-4 border-transparent hover:border-gray-300 dark:hover:border-gray-700"
                    >
                      <div className="flex flex-col sm:flex-row gap-5">
                        {/* 이미지 - 실제로 업로드된 경우에만 표시 */}
                        {mainImage && mainImage.image_url ? (
                          <div className="w-full sm:w-36 lg:w-44 h-36 sm:h-28 lg:h-32 flex-shrink-0 rounded-sm overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800">
                            <img
                              src={mainImage.image_url}
                              alt={property.title || ''}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}

                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 truncate">
                                  {property.title || '제목 없음'}
                                </h3>
                                {getStatusBadge(property.status)}
                                {property.is_premium && (
                                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-sm uppercase tracking-wide bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    PREMIUM
                                  </span>
                                )}
                                {property.is_blurred && (
                                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-sm uppercase tracking-wide bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    BLUR
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-normal">
                                {property.district} {property.dong && property.dong} {property.address}
                              </p>
                              <div className="flex flex-wrap items-center gap-5 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">유형:</span> <span className="text-gray-600 dark:text-gray-400">{property.property_type}</span>
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">거래:</span>{' '}
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {property.transaction_type === 'sale' ? '매매' :
                                     property.transaction_type === 'rent_monthly' ? '월세' :
                                     property.transaction_type === 'rent_yearly' ? '년세' : '임대'}
                                  </span>
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                  {formatPrice(property)}
                                </span>
                              </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                              <Link
                                href={`/properties/${property.id}`}
                                className="px-4 py-2 bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900 rounded-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium whitespace-nowrap border border-gray-900 dark:border-gray-50"
                              >
                                <span className="sm:hidden material-symbols-outlined text-[16px]">visibility</span>
                                <span className="hidden sm:inline">상세보기</span>
                              </Link>
                              <Link
                                href={`/properties/${property.id}/edit`}
                                className="px-4 py-2 bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-300 rounded-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium whitespace-nowrap border border-gray-300 dark:border-gray-700"
                              >
                                <span className="sm:hidden material-symbols-outlined text-[16px]">edit</span>
                                <span className="hidden sm:inline">수정</span>
                              </Link>
                              {user?.role === 'admin' && (
                                <button
                                  onClick={() => handleDelete(property.id, property.title || '')}
                                  disabled={deleting.has(property.id)}
                                  className="px-4 py-2 bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-400 rounded-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium whitespace-nowrap border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {deleting.has(property.id) ? (
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full"></span>
                                  ) : (
                                    <>
                                      <span className="sm:hidden material-symbols-outlined text-[16px]">delete</span>
                                      <span className="hidden sm:inline">삭제</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 통계 */}
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-500 text-center font-medium uppercase tracking-wide">
            총 {filteredProperties.length}개 / 전체 {properties.length}개
          </div>
        </div>
      </div>
    </div>
  )
}

