'use client'

import { useState, useMemo } from 'react'
import PropertyCard from './PropertyCard'
import { addressToCoordinates, waitForKakaoMaps } from '@/lib/utils/geocoding'

interface Property {
  id: string
  title: string
  location: string
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
}

export interface FilterState {
  propertyType: string
  minDeposit: string
  maxDeposit: string
  minRent: string
  maxRent: string
  minArea: string
  maxArea: string
  hasParking: boolean
  district: string
  radiusSearch?: {
    enabled: boolean
    centerLat?: number
    centerLng?: number
    radiusKm?: number
  }
}

interface PropertySearchSidebarProps {
  isOpen: boolean
  onClose: () => void
  properties: Property[]
  onPropertyClick?: (id: string) => void
  onDistrictChange?: (district: string) => void
  onRadiusSearchChange?: (radiusSearch: FilterState['radiusSearch']) => void
  onSearchAddress?: (address: string, coords: { lat: number; lng: number }) => void
  onApplyFilters?: (filters: FilterState) => void
  onResetFilters?: () => void
}

export default function PropertySearchSidebar({
  isOpen,
  onClose,
  properties,
  onPropertyClick,
  onDistrictChange,
  onRadiusSearchChange,
  onSearchAddress,
  onApplyFilters,
  onResetFilters,
}: PropertySearchSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showDistrictFilter, setShowDistrictFilter] = useState(false)
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const [showAreaFilter, setShowAreaFilter] = useState(false)
  const [showRadiusFilter, setShowRadiusFilter] = useState(false)
  const [radiusEnabled, setRadiusEnabled] = useState(false)
  const [radiusKm, setRadiusKm] = useState<string>('1')

  // 필터 상태
  const [filters, setFilters] = useState<FilterState>({
    propertyType: 'all',
    minDeposit: '',
    maxDeposit: '',
    minRent: '',
    maxRent: '',
    minArea: '',
    maxArea: '',
    hasParking: false,
    district: 'all',
    radiusSearch: {
      enabled: false,
    },
  })

  // 대구 구 목록
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

  // 매물 유형
  const propertyTypes = [
    { value: 'all', label: '전체' },
    { value: '상가', label: '상가' },
    { value: '사무실', label: '사무실' },
    { value: '건물', label: '건물' },
  ]

  // 금액 파싱 함수 (억/만원 → 만원)
  const parseAmount = (amount: string): number => {
    if (!amount) return 0

    const match = amount.match(/([\d.]+)억\s*([\d,]+)?만?/)
    if (match) {
      const eok = parseFloat(match[1]) * 10000
      const man = match[2] ? parseInt(match[2].replace(/,/g, '')) : 0
      return eok + man
    }

    const manMatch = amount.match(/([\d,]+)만/)
    if (manMatch) {
      return parseInt(manMatch[1].replace(/,/g, ''))
    }

    return 0
  }

  // 면적 파싱 함수 (㎡ 추출)
  const parseArea = (areaStr: string): number => {
    const match = areaStr.match(/([\d.]+)/)
    return match ? parseFloat(match[1]) : 0
  }

  // 필터링된 매물 목록
  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      // 주소 검색은 지도 이동만 수행하므로 매물 필터링에서 제외
      // 매물 검색은 별도의 필터로 처리

      // 지역 필터
      if (filters.district !== 'all') {
        if (!property.location.includes(filters.district)) return false
      }

      // 매물 유형 필터
      if (filters.propertyType !== 'all') {
        if (property.propertyType !== filters.propertyType) return false
      }

      // 보증금 필터
      if (filters.minDeposit || filters.maxDeposit) {
        const deposit = parseAmount(property.deposit)
        if (filters.minDeposit && deposit < parseInt(filters.minDeposit)) return false
        if (filters.maxDeposit && deposit > parseInt(filters.maxDeposit)) return false
      }

      // 월세 필터
      if (filters.minRent || filters.maxRent) {
        const rent = parseAmount(property.rent)
        if (filters.minRent && rent < parseInt(filters.minRent)) return false
        if (filters.maxRent && rent > parseInt(filters.maxRent)) return false
      }

      // 면적 필터
      if (filters.minArea || filters.maxArea) {
        const area = parseArea(property.area)
        if (filters.minArea && area < parseFloat(filters.minArea)) return false
        if (filters.maxArea && area > parseFloat(filters.maxArea)) return false
      }

      // 주차 필터
      if (filters.hasParking && !property.parking) return false

      return true
    })
  }, [properties, filters])

  // 주소/키워드 검색 핸들러 (지도 이동만 수행, 매물 검색 아님)
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // 카카오 지도 API 대기
      const isReady = await waitForKakaoMaps()
      if (!isReady) {
        alert('지도 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        setIsSearching(false)
        return
      }

      const query = searchQuery.trim()

      if (process.env.NODE_ENV === 'development') {
        console.log('검색 시도:', query)
      }

      // 주소 또는 키워드로 좌표 변환 (주소 검색 실패 시 키워드 검색으로 폴백)
      const coords = await addressToCoordinates(query)
      if (coords) {
        if (process.env.NODE_ENV === 'development') {
          console.log('검색 성공:', coords)
        }
        // 부모 컴포넌트에 검색 결과 전달 (지도 이동만)
        onSearchAddress?.(query, coords)
      } else {
        alert('검색 결과가 없습니다.\n\n검색 예시:\n- 반월당역, 동성로, 수성못\n- 대구 중구 동성로\n- 범어천로 33')
      }
    } catch (error) {
      console.error('검색 오류:', error)
      alert('검색 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsSearching(false)
    }
  }

  // Enter 키로 검색
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  // 필터 초기화
  const handleReset = () => {
    setSearchQuery('')
    setRadiusEnabled(false)
    setRadiusKm('1')
    const resetFilters: FilterState = {
      propertyType: 'all',
      minDeposit: '',
      maxDeposit: '',
      minRent: '',
      maxRent: '',
      minArea: '',
      maxArea: '',
      hasParking: false,
      district: 'all',
      radiusSearch: {
        enabled: false,
      },
    }
    setFilters(resetFilters)
    onRadiusSearchChange?.({
      enabled: false,
    })
    onResetFilters?.()
  }

  // 필터 적용
  const handleApply = () => {
    // 현재 필터 상태를 부모 컴포넌트에 전달
    onApplyFilters?.(filters)
    // 모바일에서는 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  // 모바일에서 사이드바 오버레이
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Search & Filter Container */}
      <div className="p-4 border-b border-[#f0f2f4] dark:border-gray-800 flex flex-col gap-4">
        {/* Address Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="flex w-full items-stretch rounded-lg h-12 bg-[#f0f2f4] dark:bg-gray-800 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <input
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-transparent text-[#111318] dark:text-white focus:outline-none placeholder:text-[#616f89] dark:placeholder:text-gray-500 px-4 text-base font-normal leading-normal"
              placeholder="장소, 건물명, 주소 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              disabled={isSearching}
              title="장소명, 건물명, 주소를 입력하면 지도가 해당 위치로 이동합니다"
            />
            {isSearching ? (
              <div className="flex items-center justify-center px-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            ) : (
              <button
                type="submit"
                className="flex items-center justify-center px-4 text-[#616f89] dark:text-gray-400 hover:text-primary transition-colors"
                disabled={isSearching}
                title="검색"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
            )}
          </div>
        </form>

        {/* Chips / Filters */}
        <div className="flex gap-2 flex-wrap">
          {/* District Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDistrictFilter(!showDistrictFilter)}
              className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors pl-3 pr-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <p className="text-[#111318] dark:text-gray-200 text-xs font-medium leading-normal">
                {filters.district === 'all' ? '지역' : filters.district}
              </p>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {showDistrictFilter && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 w-48">
                {districts.map((district) => (
                  <button
                    key={district}
                    onClick={() => {
                      setFilters({ ...filters, district })
                      setShowDistrictFilter(false)
                      // 지역 변경 시 지도 이동
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

          {/* Type Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors pl-3 pr-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <p className="text-[#111318] dark:text-gray-200 text-xs font-medium leading-normal">
                {propertyTypes.find((t) => t.value === filters.propertyType)?.label || '유형'}
              </p>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {showTypeFilter && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 w-40">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setFilters({ ...filters, propertyType: type.value })
                      setShowTypeFilter(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPriceFilter(!showPriceFilter)}
              className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors pl-3 pr-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <p className="text-[#111318] dark:text-gray-200 text-xs font-medium leading-normal">
                가격
              </p>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {showPriceFilter && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 w-72">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">보증금 (만원)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="최소"
                        value={filters.minDeposit}
                        onChange={(e) =>
                          setFilters({ ...filters, minDeposit: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="최대"
                        value={filters.maxDeposit}
                        onChange={(e) =>
                          setFilters({ ...filters, maxDeposit: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">월세 (만원)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="최소"
                        value={filters.minRent}
                        onChange={(e) => setFilters({ ...filters, minRent: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="최대"
                        value={filters.maxRent}
                        onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPriceFilter(false)}
                    className="w-full py-2 bg-primary text-white rounded text-sm font-medium"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Area Filter */}
          <div className="relative">
            <button
              onClick={() => setShowAreaFilter(!showAreaFilter)}
              className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors pl-3 pr-2 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            >
              <p className="text-[#111318] dark:text-gray-200 text-xs font-medium leading-normal">
                면적
              </p>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {showAreaFilter && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 w-72">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">면적 (㎡)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="최소"
                        value={filters.minArea}
                        onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="최대"
                        value={filters.maxArea}
                        onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="parking"
                      checked={filters.hasParking}
                      onChange={(e) =>
                        setFilters({ ...filters, hasParking: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="parking" className="text-sm">
                      주차 가능만 보기
                    </label>
                  </div>
                  <button
                    onClick={() => setShowAreaFilter(false)}
                    className="w-full py-2 bg-primary text-white rounded text-sm font-medium"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Radius Search Filter */}
          <div className="relative">
            <button
              onClick={() => setShowRadiusFilter(!showRadiusFilter)}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg transition-colors pl-3 pr-2 border ${
                radiusEnabled
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <p className="text-xs font-medium leading-normal">
                반경 검색 {radiusEnabled && `(${radiusKm}km)`}
              </p>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
            {showRadiusFilter && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 w-72">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="radiusEnabled"
                      checked={radiusEnabled}
                      onChange={(e) => {
                        setRadiusEnabled(e.target.checked)
                        if (!e.target.checked) {
                          onRadiusSearchChange?.({
                            enabled: false,
                          })
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <label htmlFor="radiusEnabled" className="text-sm font-medium">
                      반경 검색 활성화
                    </label>
                  </div>
                  {radiusEnabled && (
                    <>
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          반경 거리 (km)
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          max="50"
                          step="0.5"
                          placeholder="1"
                          value={radiusKm}
                          onChange={(e) => {
                            const value = e.target.value
                            setRadiusKm(value)
                            if (value && parseFloat(value) > 0) {
                              onRadiusSearchChange?.({
                                enabled: true,
                                radiusKm: parseFloat(value),
                              })
                            }
                          }}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          지도에서 중심점을 클릭하여 검색 위치를 설정하세요
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowRadiusFilter(false)
                        }}
                        className="w-full py-2 bg-primary text-white rounded text-sm font-medium"
                      >
                        확인
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleReset}
            className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-transparent border border-[#dce0e5] dark:border-gray-600 text-[#111318] dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="truncate">초기화</span>
          </button>
          <button
            onClick={handleApply}
            className="flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-[#111318] dark:bg-white text-white dark:text-[#111318] text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <span className="truncate">적용</span>
          </button>
        </div>
      </div>

      {/* Property List */}
      <div className="flex-1 overflow-y-auto p-4 bg-background-light dark:bg-[#0b0f17]">
        <h3 className="text-[#111318] dark:text-white tracking-tight text-lg font-bold leading-tight pb-4">
          매물 {filteredProperties.length}개
        </h3>
        <div className="flex flex-col gap-4">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              onClick={() => onPropertyClick?.(property.id)}
            />
          ))}
          {filteredProperties.length === 0 && (
            <div className="text-center py-12 text-[#616f89] dark:text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-2 opacity-50">
                search_off
              </span>
              <p className="text-sm">검색 결과가 없습니다.</p>
              <button
                onClick={handleReset}
                className="mt-4 text-primary hover:underline text-sm font-medium"
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

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
        className={`fixed lg:relative inset-y-0 left-0 w-full sm:w-[380px] lg:w-[380px] bg-white dark:bg-[#111318] shadow-xl lg:shadow-none z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden text-[#616f89] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white z-50"
        >
          <span className="material-symbols-outlined text-[28px]">close</span>
        </button>

        {sidebarContent}
      </div>
    </>
  )
}
