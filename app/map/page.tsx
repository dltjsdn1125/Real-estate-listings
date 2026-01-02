'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MapSearchHeader from '@/components/map/MapSearchHeader'
import CentralSearchBar from '@/components/map/CentralSearchBar'
import UnifiedSidebar from '@/components/map/UnifiedSidebar'
import MapView from '@/components/map/MapView'
import FavoritePropertyModal from '@/components/map/FavoritePropertyModal'
import QuickPropertyRegisterModal from '@/components/map/QuickPropertyRegisterModal'
import { addFavorite } from '@/lib/supabase/favorites'
import { FilterState } from '@/components/map/PropertySearchSidebar'
import { getProperties } from '@/lib/supabase/properties'
import { supabase } from '@/lib/supabase/client'
import { getDistrictCoordinates } from '@/lib/constants/daeguDistricts'
import { useAuth } from '@/lib/hooks/useAuth'

interface PropertyForMap {
  id: string
  title: string
  location: string
  address?: string | null
  deposit: string
  rent: string
  area: string
  parking?: boolean
  type: 'standard' | 'premium'
  isNew?: boolean
  propertyType?: string
  isLocked?: boolean
  lat?: number
  lng?: number
  isOwner?: boolean
  imageUrl: string
  imageAlt: string
}

export default function MapPage() {
  const router = useRouter()
  const { user, isAuthenticated, isApproved, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [properties, setProperties] = useState<PropertyForMap[]>([])
  const [loading, setLoading] = useState(true)
  const [userTier, setUserTier] = useState<string>('bronze')
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [mapLevel, setMapLevel] = useState<number>(8)
  const [radiusSearch, setRadiusSearch] = useState<{
    enabled: boolean
    centerLat?: number
    centerLng?: number
    radiusKm?: number
  }>({ enabled: false })
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
    radiusSearch: { enabled: false },
  })
  const [error, setError] = useState<string | null>(null)
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState('')
  const [sidebarTab, setSidebarTab] = useState<'search' | 'my-properties' | 'favorites' | 'register'>('search')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [pinItMode, setPinItMode] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerModalInitialData, setRegisterModalInitialData] = useState<{
    lat?: number
    lng?: number
    title?: string
    address?: string
  } | null>(null)
  // 현재 지도 영역 bounds
  const [currentBounds, setCurrentBounds] = useState<{
    sw: { lat: number; lng: number }
    ne: { lat: number; lng: number }
  } | null>(null)
  // Pin it 모드 안내 메시지
  const [pinItMessage, setPinItMessage] = useState<string | null>(null)

  // 승인 상태 확인 및 리다이렉트
  useEffect(() => {
    // 로딩 중이면 대기
    if (authLoading) return

    // 로그인한 사용자가 승인되지 않은 경우에만 리다이렉트
    // 비로그인 사용자는 맵 페이지 접근 가능 (조회만 가능)
    // isApproved가 명확히 false일 때만 리다이렉트 (undefined는 제외)
    if (isAuthenticated && user && user.approval_status !== 'approved') {
      console.log('승인되지 않은 사용자, pending 페이지로 리다이렉트')
      router.push('/auth/pending')
      return
    }
  }, [isAuthenticated, isApproved, authLoading, router, user])

  useEffect(() => {
    // 매물 로드 (승인된 사용자 또는 비로그인 사용자)
    // 맵은 항상 표시되어야 하므로 매물 로딩과 분리
    if (!authLoading) {
      // 승인된 사용자 또는 비로그인 사용자는 매물 조회 가능
      if (!isAuthenticated || isApproved) {
        loadProperties()
        if (isAuthenticated) {
          checkUserTier()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusSearch, authLoading, isApproved, isAuthenticated, searchKeyword])

  const checkUserTier = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('users').select('tier').eq('id', user.id).single()
      if (data) {
        setUserTier(data.tier)
      }
    }
  }

  // 필터를 받아서 매물을 로드하는 함수
  const loadPropertiesWithFilters = async (customFilters?: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: any = customFilters || {
        status: 'available',
        limit: 50,
      }
      
      // 키워드 검색 파라미터 추가 (customFilters에 없으면 state에서 가져옴)
      if (!filters.keyword && searchKeyword && searchKeyword.trim()) {
        filters.keyword = searchKeyword.trim()
      }
      
      // 반경 검색 파라미터 추가
      if (radiusSearch.enabled && radiusSearch.centerLat && radiusSearch.centerLng && radiusSearch.radiusKm) {
        filters.centerLat = radiusSearch.centerLat
        filters.centerLng = radiusSearch.centerLng
        filters.radiusKm = radiusSearch.radiusKm
      }
      
      // 타임아웃 설정 (60초로 증가 - 키워드 검색 시 더 오래 걸릴 수 있음)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('매물을 불러오는 데 시간이 너무 오래 걸립니다. 네트워크 연결을 확인해주세요.')), 60000)
      })
      
      // 디버깅: 검색 전 로그
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 매물 검색 시작:', {
          keyword: filters.keyword || '없음',
          filters: JSON.stringify(filters, null, 2)
        })
      }

      const result = await Promise.race([
        getProperties(filters),
        timeoutPromise
      ])
      
      const { data, error: fetchError } = result

      // 디버깅: 키워드 검색 결과 확인
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 매물 검색 결과:', {
          keyword: filters.keyword || '없음',
          resultCount: data?.length || 0,
          error: fetchError?.message || null,
          hasData: !!data,
          firstItem: data?.[0] ? { id: data[0].id, title: data[0].title } : null
        })
      }

      if (fetchError) {
        throw new Error(fetchError.message || '매물을 불러오는 중 오류가 발생했습니다.')
      }

      if (data) {
        const formattedProperties: PropertyForMap[] = data.map((property: any) => {
          // 금액 포맷팅 (만원 단위)
          const formatAmount = (amount: number | null) => {
            if (!amount) return '0'
            const inManWon = amount / 10000
            return inManWon >= 10000
              ? `${(inManWon / 10000).toFixed(1)}억`
              : `${inManWon.toLocaleString()}만`
          }

          const deposit =
            property.transaction_type === 'sale'
              ? formatAmount(property.sale_price)
              : formatAmount(property.deposit)
          const rent =
            property.transaction_type === 'rent_monthly'
              ? formatAmount(property.monthly_rent)
              : property.transaction_type === 'rent_yearly'
              ? formatAmount(property.yearly_rent)
              : '0'

          // 면적 포맷팅
          const area = property.exclusive_area
            ? `${property.exclusive_area}평`
            : property.contract_area
            ? `${property.contract_area}평`
            : 'N/A'

          // 지역 정보
          const location = `${property.district}${property.dong ? ', ' + property.dong : ''} • ${
            property.floor_current ? property.floor_current + 'F' : '1F'
          }`

          // 매물 타입 결정
          const isPremium = property.is_premium || false
          const isLocked = isPremium && !['premium', 'agent', 'admin'].includes(userTier)

          // 등록 후 7일 이내면 NEW
          const isNew =
            new Date().getTime() - new Date(property.created_at).getTime() <
            7 * 24 * 60 * 60 * 1000

          // 매물 유형 한글화
          const propertyTypeMap: Record<string, string> = {
            store: '상가',
            office: '사무실',
            building: '건물',
          }

          // 이미지 URL 가져오기 (첫 번째 이미지 또는 기본 이미지)
          const firstImage = property.property_images?.[0]
          const imageUrl = firstImage?.image_url || '/images/placeholder-property.jpg'
          const imageAlt = firstImage?.alt_text || property.title

          return {
            id: property.id,
            title: property.title,
            location,
            address: property.address || null,
            deposit,
            rent,
            area,
            parking: property.has_parking,
            type: isPremium ? 'premium' : 'standard',
            isNew,
            propertyType: propertyTypeMap[property.property_type] || property.property_type,
            isLocked,
            lat: property.latitude ? Number(property.latitude) : undefined,
            lng: property.longitude ? Number(property.longitude) : undefined,
            isOwner: !!(isAuthenticated && user && property.created_by === user.id),
            imageUrl,
            imageAlt,
          }
        })

        setProperties(formattedProperties)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 매물 로드 완료:', {
            total: formattedProperties.length,
            withKeyword: filters.keyword || '없음'
          })
        }
      } else {
        setProperties([])
      }
    } catch (err: any) {
      console.error('Error loading properties:', err)
      const errorMessage = err?.message || '매물을 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.'
      setError(errorMessage)
      setProperties([])
      
      // 에러가 발생해도 로그인 페이지로 리다이렉트하지 않음
      // 에러는 UI에 표시만 하고 사용자는 맵 페이지에 계속 머물 수 있음
    } finally {
      setLoading(false)
    }
  }

  const loadProperties = async () => {
    await loadPropertiesWithFilters()
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // 사이드바에서 매물 클릭 시 지도 이동 (세부 페이지 이동 대신)
  const handlePropertyClick = (id: string) => {
    const property = properties.find(p => p.id === id)
    if (property?.lat && property?.lng) {
      setMapCenter({ lat: property.lat, lng: property.lng })
      setMapLevel(3) // 상세 레벨로 확대
    }
  }

  // 세부 페이지로 이동
  const handleViewPropertyDetail = (id: string) => {
    router.push(`/properties/${id}`)
  }

  // 매물 수정하기
  const handleEditProperty = (id: string) => {
    router.push(`/properties/${id}/edit`)
  }

  const handleSearchArea = (bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    // 현재 지도 영역 검색 로직
    if (bounds) {
      // 경계 좌표를 사용하여 해당 영역 내 매물 검색
      // 중심점 계산
      const centerLat = (bounds.sw.lat + bounds.ne.lat) / 2
      const centerLng = (bounds.sw.lng + bounds.ne.lng) / 2
      
      // 대략적인 반경 계산 (km)
      // 하버사인 공식 사용 또는 간단한 거리 계산
      const latDiff = bounds.ne.lat - bounds.sw.lat
      const lngDiff = bounds.ne.lng - bounds.sw.lng
      const radiusKm = Math.max(latDiff * 111, lngDiff * 111 * Math.cos(centerLat * Math.PI / 180)) // 대략적인 반경
      
      // 반경 검색 활성화
      setRadiusSearch({
        enabled: true,
        centerLat,
        centerLng,
        radiusKm: Math.max(radiusKm, 1), // 최소 1km
      })
    } else {
      // 경계 정보가 없으면 전체 매물 다시 로드
      loadProperties()
    }
  }

  const handleSearchAddress = (address: string, coords: { lat: number; lng: number }) => {
    // 검색된 주소로 지도 이동만 수행 (매물 검색 아님)
    setMapCenter({ lat: coords.lat, lng: coords.lng })
    setMapLevel(3) // 상세 레벨로 확대
    // 반경 검색은 자동 활성화하지 않음 (사용자가 원할 때만 사용)
    // 지도 이동만 수행
  }

  const handleApplyFilters = () => {
    // 필터 적용 시 매물 재검색
    loadPropertiesWithFilters()
  }

  const handleResetFilters = () => {
    // 필터 초기화
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
      radiusSearch: { enabled: false },
    }
    setFilters(resetFilters)
    setRadiusSearch({ enabled: false })
    setSearchKeyword('') // 검색 키워드도 초기화
    loadPropertiesWithFilters()
  }

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleKeywordSearch = (keyword: string) => {
    // 키워드 검색 수행
    if (keyword && keyword.trim()) {
      const trimmedKeyword = keyword.trim()

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 handleKeywordSearch 호출:', trimmedKeyword)
      }

      setSearchKeyword(trimmedKeyword)

      // 즉시 매물 검색 수행 - 대구 전체 지역에서 검색 (지도 영역 제한 없음)
      const searchFilters: any = {
        status: 'available',
        limit: 100, // 키워드 검색 시 더 많은 결과 표시
        keyword: trimmedKeyword,
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 검색 필터 설정:', searchFilters)
      }

      // 검색 즉시 실행
      loadPropertiesWithFilters(searchFilters)

      // 키워드 검색으로 즐겨찾기 등록 모달 열기 (로그인한 경우)
      if (isAuthenticated) {
        setSelectedKeyword(trimmedKeyword)
        setFavoriteModalOpen(true)
      }
    }
  }

  const handleDistrictChange = (district: string) => {
    const districtInfo = getDistrictCoordinates(district)
    setMapCenter({ lat: districtInfo.lat, lng: districtInfo.lng })
    setMapLevel(districtInfo.level)
  }

  const handleRadiusSearchChange = (search?: {
    enabled: boolean
    centerLat?: number
    centerLng?: number
    radiusKm?: number
  }) => {
    if (!search) return
    setRadiusSearch(search)
    if (search.enabled && search.centerLat && search.centerLng) {
      setMapCenter({ lat: search.centerLat, lng: search.centerLng })
      setMapLevel(6) // 반경 검색 시 더 확대된 레벨
    }
  }

  // handleMapClick은 위에서 정의됨 (Pin it 모드 처리)

  const handleQuickRegister = () => {
    // 간단 등록 버튼 클릭 시 사이드바의 등록 탭 열기
    console.log('handleQuickRegister 호출', { isAuthenticated, userRole: user?.role, userTier: user?.tier })
    // 일반 회원(bronze) 이상 또는 admin/agent만 등록 가능
    if (isAuthenticated && user && (
      ['admin', 'agent'].includes(user.role) || 
      (user.tier && ['bronze', 'silver', 'gold', 'platinum', 'premium'].includes(user.tier))
    )) {
      console.log('권한 확인됨, 사이드바 열기')
      setSidebarTab('register')
      setSidebarOpen(true)
    } else {
      // 권한이 없으면 로그인 페이지로 이동
      console.log('권한 없음, 로그인 페이지로 이동')
      window.location.href = '/auth/login'
    }
  }

  const handlePinIt = () => {
    // Pin it 모드 토글
    const newMode = !pinItMode
    setPinItMode(newMode)

    // Pin it 모드 활성화 시 안내 메시지 표시 및 지도 확대
    if (newMode) {
      setPinItMessage('지도를 확대하여 건물을 클릭하세요')

      // 현재 지도 중심으로 최대 확대 (level 2 = 건물 식별 가능한 레벨)
      // 현재 bounds의 중심이 있으면 그 위치로, 없으면 현재 mapCenter 사용
      if (currentBounds) {
        const centerLat = (currentBounds.sw.lat + currentBounds.ne.lat) / 2
        const centerLng = (currentBounds.sw.lng + currentBounds.ne.lng) / 2
        setMapCenter({ lat: centerLat, lng: centerLng })
      }
      // 지도를 건물 식별 가능한 레벨로 확대 (약간의 딜레이로 애니메이션 효과)
      setTimeout(() => {
        setMapLevel(2)
      }, 100)
    } else {
      setPinItMessage(null)
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    // Pin it 모드일 때만 처리
    if (!pinItMode) return

    // 로딩 메시지 표시
    setPinItMessage('위치 정보를 가져오는 중...')

    // 건물 정보 가져오기
    const { getBuildingInfoFromCoordinates } = await import('@/lib/utils/geocoding')
    const { buildingName, address } = await getBuildingInfoFromCoordinates(lat, lng)

    // 제목 생성: 건물명이 있으면 "건물명/주소", 없으면 "주소"
    const title = buildingName && address
      ? `${buildingName}/${address}`
      : address || `위치 (${lat.toFixed(6)}, ${lng.toFixed(6)})`

    // 등록 모달 열기
    setRegisterModalInitialData({
      lat,
      lng,
      title,
      address: address || undefined,
    })
    setRegisterModalOpen(true)
    setPinItMode(false) // Pin it 모드 해제
    setPinItMessage(null) // 메시지 초기화
  }

  // 내 위치찾기 핸들러 (고정밀 GPS)
  const handleMyLocation = () => {
    if (!navigator.geolocation) { alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.'); return }
    setPinItMessage('내 위치를 찾는 중... (고정밀 GPS)')
    navigator.geolocation.getCurrentPosition(
      (position) => { setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude }); setMapLevel(1); setPinItMessage(null) },
      (error) => { setPinItMessage(null); alert(error.code === 1 ? '위치 정보 접근이 거부되었습니다.' : error.code === 2 ? '위치 정보를 사용할 수 없습니다.' : error.code === 3 ? '위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.' : '위치를 찾을 수 없습니다.') },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )
  }

  // 매물 로딩 중이어도 맵은 표시 (로딩 오버레이만 표시)
  // 에러가 발생해도 맵은 표시 (에러 메시지만 표시)

  return (
    <div 
      className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden h-screen flex flex-col"
      onClick={(e) => {
        // 최상위 div의 클릭 이벤트가 의도치 않게 전파되지 않도록 방지
        // 단, 명시적으로 이벤트를 처리하는 요소는 제외
        if (e.target === e.currentTarget) {
          e.stopPropagation()
        }
      }}
    >
      <MapSearchHeader 
        onToggleSidebar={handleToggleSidebar} 
        onQuickRegister={handleQuickRegister}
        onPinIt={handlePinIt}
        pinItMode={pinItMode}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* 통합 사이드바 (왼쪽) */}
        <UnifiedSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          properties={properties}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
          onPropertyClick={handlePropertyClick}
          onDistrictChange={handleDistrictChange}
          onSearchAddress={handleSearchAddress}
          onKeywordSearch={handleKeywordSearch}
          onMyLocationClick={handleMyLocation}
          initialTab={sidebarTab}
        />

        {/* 지도 영역 */}
        <div className="flex-1 relative">
          <MapView
            onSearchArea={handleSearchArea}
            onMapClick={handleMapClick}
            onBoundsChange={setCurrentBounds}
            center={mapCenter}
            level={mapLevel}
            pinItMode={pinItMode}
            properties={properties
              .filter((p) => p.lat && p.lng)
              .map((p) => ({
                id: p.id,
                title: p.title,
                lat: p.lat!,
                lng: p.lng!,
                type: p.type,
                deposit: p.deposit,
                rent: p.rent,
                location: p.location,
                area: p.area,
                propertyType: p.propertyType,
              }))}
          />

          {/* 중앙 검색바 */}
          <CentralSearchBar
            onSearchAddress={handleSearchAddress}
            onKeywordSearch={handleKeywordSearch}
          />

          {/* 매물 로딩 오버레이 */}
          {loading && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">매물을 불러오는 중...</p>
            </div>
          )}

          {/* Pin it 모드 안내 메시지 */}
          {pinItMessage && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-primary text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-pulse">
              <span className="material-symbols-outlined text-[24px]">push_pin</span>
              <p className="text-sm font-medium">{pinItMessage}</p>
              <button
                onClick={() => {
                  setPinItMode(false)
                  setPinItMessage(null)
                }}
                className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
                title="취소"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* 에러 메시지 오버레이 */}
          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-4 py-2 rounded-lg shadow-lg max-w-md">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-[18px]">warning</span>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    loadProperties()
                  }}
                  className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 즐겨찾기 모달 */}
      <FavoritePropertyModal
        isOpen={favoriteModalOpen}
        onClose={() => {
          setFavoriteModalOpen(false)
          setSelectedKeyword('')
        }}
        keyword={selectedKeyword}
        onSuccess={() => {
          setFavoriteModalOpen(false)
          setSelectedKeyword('')
        }}
      />

      {/* 등록 모달 */}
      <QuickPropertyRegisterModal
        isOpen={registerModalOpen}
        onClose={() => {
          setRegisterModalOpen(false)
          setRegisterModalInitialData(null)
        }}
        initialLocation={registerModalInitialData?.lat && registerModalInitialData?.lng
          ? { lat: registerModalInitialData.lat, lng: registerModalInitialData.lng }
          : undefined
        }
        initialTitle={registerModalInitialData?.title}
        initialAddress={registerModalInitialData?.address}
        onSuccess={() => {
          setRegisterModalOpen(false)
          setRegisterModalInitialData(null)
          loadProperties() // 매물 목록 새로고침
        }}
        onAddToFavorites={async (propertyId: string) => {
          if (user) {
            await addFavorite(user.id, propertyId)
          }
        }}
      />
    </div>
  )
}

