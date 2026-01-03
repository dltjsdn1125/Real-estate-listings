'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import PropertyCard from './PropertyCard'
import QuickPropertyRegisterModal from './QuickPropertyRegisterModal'
import FavoritePropertyModal from './FavoritePropertyModal'
import { addressToCoordinates, waitForKakaoMaps } from '@/lib/utils/geocoding'
import { FilterState } from './PropertySearchSidebar'
import { addFavorite, removeFavorite } from '@/lib/supabase/favorites'

interface Property {
  id: string
  title: string
  location: string
  address?: string | null
  deposit: string
  rent: string
  area: string
  parking?: boolean
  type: 'standard' | 'premium'
  imageUrl: string
  imageAlt: string
  isNew?: boolean
  propertyType?: string
  isLocked?: boolean
  lat?: number
  lng?: number
  isOwner?: boolean
}

interface UnifiedSidebarProps {
  isOpen: boolean
  onClose: () => void
  properties: Property[]
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onPropertyClick?: (id: string) => void
  onDistrictChange?: (district: string) => void
  onSearchAddress?: (address: string, coords: { lat: number; lng: number }) => void
  onKeywordSearch?: (keyword: string) => void
  onRegisterClick?: () => void
  onMyLocationClick?: () => void
  initialTab?: 'search' | 'my-properties' | 'favorites' | 'register'
}

export default function UnifiedSidebar({
  isOpen,
  onClose,
  properties,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  onPropertyClick,
  onDistrictChange,
  onSearchAddress,
  onKeywordSearch,
  onRegisterClick,
  onMyLocationClick,
  initialTab = 'search',
}: UnifiedSidebarProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'search' | 'my-properties' | 'favorites' | 'register'>(initialTab)
  const [myProperties, setMyProperties] = useState<Property[]>([])
  const [favorites, setFavorites] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showDistrictFilter, setShowDistrictFilter] = useState(false)
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const [showAreaFilter, setShowAreaFilter] = useState(false)

  const districts = [
    'all',
    '중구',
    '동구',
    '서구',
    '남구',
    '북구',
    '수성구',
    '달서구',
    '달성군',
  ]

  const propertyTypes = [
    { value: 'all', label: '전체' },
    { value: '상가', label: '상가' },
    { value: '사무실', label: '사무실' },
    { value: '건물', label: '건물' },
  ]

  // 필터링된 매물 목록
  // 주의: 키워드 검색은 서버에서 수행되므로, 여기서는 추가 필터만 적용
  const filteredProperties = useMemo(() => {
    // properties는 이미 서버에서 키워드 검색이 적용된 결과
    return properties.filter((property) => {
      if (filters.district !== 'all') {
        if (!property.location.includes(filters.district)) return false
      }
      if (filters.propertyType !== 'all') {
        if (property.propertyType !== filters.propertyType) return false
      }
      return true
    })
  }, [properties, filters])

  // 내가 등록한 매물 로드
  const loadMyProperties = async () => {
    if (!isAuthenticated || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(*)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formatted: Property[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: `${p.district}${p.dong ? ', ' + p.dong : ''}${p.floor_current ? ' • ' + p.floor_current + 'F' : ''}`,
          address: p.address || undefined,
          deposit: p.deposit ? `${(p.deposit / 10000).toLocaleString()}만` : '0',
          rent: p.monthly_rent ? `${(p.monthly_rent / 10000).toLocaleString()}만` : '0',
          area: p.exclusive_area ? `${p.exclusive_area}평` : 'N/A',
          parking: p.has_parking,
          type: (p.is_premium ? 'premium' : 'standard') as 'premium' | 'standard',
          imageUrl: p.property_images?.[0]?.image_url || '',
          imageAlt: p.title,
          propertyType: p.property_type === 'store' ? '상가' : p.property_type === 'office' ? '사무실' : '건물',
          lat: p.latitude ? Number(p.latitude) : undefined,
          lng: p.longitude ? Number(p.longitude) : undefined,
          isOwner: true, // 내 매물은 항상 소유자
        }))
        setMyProperties(formatted)
      }
    } catch (error) {
      console.error('내 매물 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 즐겨찾기 매물 로드
  const loadFavorites = async () => {
    if (!isAuthenticated || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          properties:property_id (
            *,
            property_images(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formatted: Property[] = data
          .filter((f: any) => f.properties)
          .map((f: any) => {
            const p = f.properties
            return {
              id: p.id,
              title: p.title,
              location: `${p.district}${p.dong ? ', ' + p.dong : ''}${p.floor_current ? ' • ' + p.floor_current + 'F' : ''}`,
              address: p.address || undefined,
              deposit: p.deposit ? `${(p.deposit / 10000).toLocaleString()}만` : '0',
              rent: p.monthly_rent ? `${(p.monthly_rent / 10000).toLocaleString()}만` : '0',
              area: p.exclusive_area ? `${p.exclusive_area}평` : 'N/A',
              parking: p.has_parking,
              type: (p.is_premium ? 'premium' : 'standard') as 'premium' | 'standard',
              imageUrl: p.property_images?.[0]?.image_url || '',
              imageAlt: p.title,
              propertyType: p.property_type === 'store' ? '상가' : p.property_type === 'office' ? '사무실' : '건물',
              lat: p.latitude ? Number(p.latitude) : undefined,
              lng: p.longitude ? Number(p.longitude) : undefined,
              isOwner: user && p.created_by === user.id, // 즐겨찾기는 소유자 확인 필요
            }
          })
        setFavorites(formatted)
      }
    } catch (error) {
      console.error('즐겨찾기 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (activeTab === 'my-properties') {
        loadMyProperties()
      } else if (activeTab === 'favorites') {
        loadFavorites()
      }
    }
  }, [isOpen, activeTab, isAuthenticated])

  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // 주소/키워드 검색
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const query = searchQuery.trim()

      // 키워드 검색 먼저 수행 (매물 검색)
      onKeywordSearch?.(query)

      // 카카오맵 로드 확인
      const isReady = await waitForKakaoMaps()
      if (isReady) {
        const coords = await addressToCoordinates(query)
        if (coords) {
          onSearchAddress?.(query, coords)
        }
      }

      // 즐겨찾기 모달은 로그인 사용자에게만 표시
      if (isAuthenticated) {
        setSelectedKeyword(query)
        setFavoriteModalOpen(true)
      }
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleFavoriteClick = async (propertyId: string) => {
    if (!isAuthenticated || !user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const isFavorited = favorites.some((f) => f.id === propertyId)

      if (isFavorited) {
        await removeFavorite(user.id, propertyId)
      } else {
        await addFavorite(user.id, propertyId)
      }

      if (activeTab === 'favorites') {
        loadFavorites()
      }
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
    }
  }

  const currentProperties = 
    activeTab === 'search' ? filteredProperties :
    activeTab === 'my-properties' ? myProperties :
    activeTab === 'favorites' ? favorites : []

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 w-64 sm:w-80 lg:w-96 bg-white dark:bg-[#111318] shadow-xl lg:shadow-none z-40 transition-transform duration-300 border-r border-gray-200 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-sm sm:text-lg font-bold text-[#111318] dark:text-white">매물 탐색</h2>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              className="lg:hidden text-[#616f89] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 sm:gap-2 flex-nowrap overflow-x-auto">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveTab('search')
              }}
              className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'search'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
              }`}
            >
              검색
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab('my-properties')
                  }}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'my-properties'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
                  }`}
                >
                  내 매물
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab('favorites')
                  }}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'favorites'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
                  }`}
                >
                  즐찾
                </button>
                {(user?.role === 'admin' || user?.role === 'agent') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('register')
                      setRegisterModalOpen(true)
                      onRegisterClick?.()
                    }}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === 'register'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
                    }`}
                  >
                    등록
                  </button>
                )}
                {/* 내 위치찾기 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMyLocationClick?.()
                  }}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 whitespace-nowrap"
                  title="내 위치로 이동"
                >
                  <span className="material-symbols-outlined text-[14px] sm:text-[18px]">my_location</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-180px)]">
          {activeTab === 'search' && (
            <div className="p-2 sm:p-4 space-y-2 sm:space-y-4">
              {/* 검색바 */}
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="flex w-full items-stretch rounded-lg h-9 sm:h-12 bg-[#f0f2f4] dark:bg-gray-800 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <input
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-transparent text-[#111318] dark:text-white focus:outline-none placeholder:text-[#616f89] dark:placeholder:text-gray-500 px-2 sm:px-4 text-xs sm:text-base font-normal leading-normal"
                    placeholder="장소, 건물명, 주소 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isSearching}
                  />
                  {isSearching ? (
                    <div className="flex items-center justify-center px-2 sm:px-4">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="flex items-center justify-center px-2 sm:px-4 text-[#616f89] dark:text-gray-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[24px]">search</span>
                    </button>
                  )}
                </div>
              </form>

              {/* 필터 */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xs sm:text-sm font-medium text-[#111318] dark:text-white">필터</h3>

                {/* 지역 필터 */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    지역
                  </label>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDistrictFilter(!showDistrictFilter)
                      }}
                      className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                    >
                      <span className="text-[#111318] dark:text-white truncate">
                        {filters.district === 'all' ? '전체' : filters.district}
                      </span>
                      <span className="material-symbols-outlined text-[14px] sm:text-[18px]">expand_more</span>
                    </button>
                    {showDistrictFilter && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                        {districts.map((district) => (
                          <button
                            key={district}
                            onClick={(e) => {
                              e.stopPropagation()
                              onFiltersChange({ ...filters, district })
                              setShowDistrictFilter(false)
                              onDistrictChange?.(district)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                          >
                            {district === 'all' ? '전체' : district}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 매물 유형 필터 */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    매물 유형
                  </label>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowTypeFilter(!showTypeFilter)
                      }}
                      className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                    >
                      <span className="text-[#111318] dark:text-white truncate">
                        {propertyTypes.find((t) => t.value === filters.propertyType)?.label || '전체'}
                      </span>
                      <span className="material-symbols-outlined text-[14px] sm:text-[18px]">expand_more</span>
                    </button>
                    {showTypeFilter && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                        {propertyTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={(e) => {
                              e.stopPropagation()
                              onFiltersChange({ ...filters, propertyType: type.value })
                              setShowTypeFilter(false)
                            }}
                            className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs sm:text-sm"
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 가격 필터 */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    가격
                  </label>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowPriceFilter(!showPriceFilter)
                      }}
                      className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                    >
                      <span className="text-[#111318] dark:text-white truncate">
                        {filters.minDeposit || filters.maxDeposit || filters.minRent || filters.maxRent
                          ? '설정됨'
                          : '전체'}
                      </span>
                      <span className="material-symbols-outlined text-[14px] sm:text-[18px]">expand_more</span>
                    </button>
                    {showPriceFilter && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 sm:p-4 z-50">
                        <div className="space-y-2 sm:space-y-3">
                          <div>
                            <label className="text-[10px] sm:text-xs font-medium mb-1 block">보증금</label>
                            <div className="flex gap-1 sm:gap-2">
                              <input
                                type="number"
                                placeholder="최소"
                                value={filters.minDeposit}
                                onChange={(e) =>
                                  onFiltersChange({ ...filters, minDeposit: e.target.value })
                                }
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm"
                              />
                              <input
                                type="number"
                                placeholder="최대"
                                value={filters.maxDeposit}
                                onChange={(e) =>
                                  onFiltersChange({ ...filters, maxDeposit: e.target.value })
                                }
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] sm:text-xs font-medium mb-1 block">월세</label>
                            <div className="flex gap-1 sm:gap-2">
                              <input
                                type="number"
                                placeholder="최소"
                                value={filters.minRent}
                                onChange={(e) => onFiltersChange({ ...filters, minRent: e.target.value })}
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm"
                              />
                              <input
                                type="number"
                                placeholder="최대"
                                value={filters.maxRent}
                                onChange={(e) => onFiltersChange({ ...filters, maxRent: e.target.value })}
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowPriceFilter(false)
                            }}
                            className="w-full py-1.5 sm:py-2 bg-primary text-white rounded text-xs sm:text-sm font-medium"
                          >
                            확인
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 면적 필터 */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    면적
                  </label>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowAreaFilter(!showAreaFilter)
                      }}
                      className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm"
                    >
                      <span className="text-[#111318] dark:text-white truncate">
                        {filters.minArea || filters.maxArea ? '설정됨' : '전체'}
                      </span>
                      <span className="material-symbols-outlined text-[14px] sm:text-[18px]">expand_more</span>
                    </button>
                    {showAreaFilter && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 sm:p-4 z-50">
                        <div className="space-y-2 sm:space-y-3">
                          <div>
                            <label className="text-[10px] sm:text-xs font-medium mb-1 block">면적 (평)</label>
                            <div className="flex gap-1 sm:gap-2">
                              <input
                                type="number"
                                placeholder="최소"
                                value={filters.minArea}
                                onChange={(e) => onFiltersChange({ ...filters, minArea: e.target.value })}
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm"
                              />
                              <input
                                type="number"
                                placeholder="최대"
                                value={filters.maxArea}
                                onChange={(e) => onFiltersChange({ ...filters, maxArea: e.target.value })}
                                className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border rounded text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <input
                              type="checkbox"
                              id="parking"
                              checked={filters.hasParking}
                              onChange={(e) =>
                                onFiltersChange({ ...filters, hasParking: e.target.checked })
                              }
                              className="w-3 h-3 sm:w-4 sm:h-4"
                            />
                            <label htmlFor="parking" className="text-[10px] sm:text-sm">
                              주차 가능만
                            </label>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowAreaFilter(false)
                            }}
                            className="w-full py-1.5 sm:py-2 bg-primary text-white rounded text-xs sm:text-sm font-medium"
                          >
                            확인
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 필터 적용 버튼 */}
                <div className="flex gap-1 sm:gap-2 pt-1 sm:pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onResetFilters()
                    }}
                    className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-[#111318] dark:text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    초기화
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onApplyFilters()
                    }}
                    className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg text-[10px] sm:text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    적용
                  </button>
                </div>
              </div>

              {/* 매물 목록 */}
              <div className="mt-3 sm:mt-6">
                <h3 className="text-[#111318] dark:text-white tracking-tight text-sm sm:text-lg font-bold leading-tight pb-2 sm:pb-4">
                  매물 {filteredProperties.length}개
                </h3>
                <div className="flex flex-col gap-2 sm:gap-4">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      {...property}
                      onClick={() => onPropertyClick?.(property.id)}
                      onViewDetail={(id) => {
                        // 상세 페이지로 이동
                        window.location.href = `/properties/${id}`
                      }}
                      onFavorite={handleFavoriteClick}
                      onEdit={(id) => {
                        window.location.href = `/properties/${id}/edit`
                      }}
                    />
                  ))}
                  {filteredProperties.length === 0 && (
                    <div className="text-center py-6 sm:py-12 text-[#616f89] dark:text-gray-400">
                      <span className="material-symbols-outlined text-3xl sm:text-5xl mb-2 opacity-50">
                        search_off
                      </span>
                      <p className="text-xs sm:text-sm">검색 결과가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'my-properties' && (
            <div className="p-2 sm:p-4">
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <h3 className="text-[#111318] dark:text-white tracking-tight text-sm sm:text-lg font-bold leading-tight pb-2 sm:pb-4">
                    내 매물 {myProperties.length}개
                  </h3>
                  <div className="flex flex-col gap-2 sm:gap-4">
                    {myProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        {...property}
                        isOwner={true}
                        onClick={() => onPropertyClick?.(property.id)}
                        onViewDetail={(id) => {
                          window.location.href = `/properties/${id}`
                        }}
                        onFavorite={handleFavoriteClick}
                        onEdit={(id) => {
                          window.location.href = `/properties/${id}/edit`
                        }}
                      />
                    ))}
                    {myProperties.length === 0 && (
                      <div className="text-center py-6 sm:py-12 text-[#616f89] dark:text-gray-400">
                        <span className="material-symbols-outlined text-3xl sm:text-5xl mb-2 opacity-50">
                          home
                        </span>
                        <p className="text-xs sm:text-sm">등록한 매물이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="p-2 sm:p-4">
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <h3 className="text-[#111318] dark:text-white tracking-tight text-sm sm:text-lg font-bold leading-tight pb-2 sm:pb-4">
                    즐겨찾기 {favorites.length}개
                  </h3>
                  <div className="flex flex-col gap-2 sm:gap-4">
                    {favorites.map((property) => (
                      <PropertyCard
                        key={property.id}
                        {...property}
                        onClick={() => onPropertyClick?.(property.id)}
                        onViewDetail={(id) => {
                          window.location.href = `/properties/${id}`
                        }}
                        onFavorite={handleFavoriteClick}
                        onEdit={(id) => {
                          window.location.href = `/properties/${id}/edit`
                        }}
                      />
                    ))}
                    {favorites.length === 0 && (
                      <div className="text-center py-6 sm:py-12 text-[#616f89] dark:text-gray-400">
                        <span className="material-symbols-outlined text-3xl sm:text-5xl mb-2 opacity-50">
                          favorite_border
                        </span>
                        <p className="text-xs sm:text-sm">즐겨찾기한 매물이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div className="p-2 sm:p-4 text-center py-6 sm:py-12 text-[#616f89] dark:text-gray-400">
              <span className="material-symbols-outlined text-3xl sm:text-5xl mb-2 opacity-50">
                add_circle
              </span>
              <p className="text-xs sm:text-sm mb-3 sm:mb-4">매물을 등록하려면 버튼을 클릭하세요</p>
              {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') ? (
                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
                >
                  매물 등록
                </button>
              ) : (
                <p className="text-[10px] sm:text-xs">매물 등록 권한이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuickPropertyRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={() => {
          loadMyProperties()
          setRegisterModalOpen(false)
          setActiveTab('my-properties')
        }}
      />
      <FavoritePropertyModal
        isOpen={favoriteModalOpen}
        onClose={() => {
          setFavoriteModalOpen(false)
          setSelectedKeyword('')
        }}
        keyword={selectedKeyword}
        onSuccess={() => {
          loadFavorites()
          setFavoriteModalOpen(false)
          setSelectedKeyword('')
          setActiveTab('favorites')
        }}
      />
    </>
  )
}

