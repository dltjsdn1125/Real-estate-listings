'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MapSearchHeader from '@/components/map/MapSearchHeader'
import PropertySearchSidebar from '@/components/map/PropertySearchSidebar'
import MapView from '@/components/map/MapView'
import QuickPropertyRegisterModal from '@/components/map/QuickPropertyRegisterModal'
import { getProperties } from '@/lib/supabase/properties'
import { supabase } from '@/lib/supabase/client'
import { getDistrictCoordinates } from '@/lib/constants/daeguDistricts'
import { useAuth } from '@/lib/hooks/useAuth'

interface PropertyForMap {
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
  lat?: number
  lng?: number
}

export default function MapPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)

  useEffect(() => {
    loadProperties()
    checkUserTier()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusSearch])

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

  const loadProperties = async () => {
    try {
      setLoading(true)
      const filters: any = {
        status: 'available',
        limit: 50,
      }
      
      // 반경 검색 파라미터 추가
      if (radiusSearch.enabled && radiusSearch.centerLat && radiusSearch.centerLng && radiusSearch.radiusKm) {
        filters.centerLat = radiusSearch.centerLat
        filters.centerLng = radiusSearch.centerLng
        filters.radiusKm = radiusSearch.radiusKm
      }
      
      const { data, error } = await getProperties(filters)

      if (error) throw error

      if (data) {
        const formattedProperties: PropertyForMap[] = data.map((property) => {
          const mainImage = property.property_images?.find((img: any) => img.is_main)
          const firstImage = property.property_images?.[0]
          const imageUrl = mainImage?.image_url || firstImage?.image_url || ''

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

          return {
            id: property.id,
            title: property.title,
            location,
            deposit,
            rent,
            area,
            parking: property.has_parking,
            type: isPremium ? 'premium' : 'standard',
            imageUrl,
            imageAlt: property.title,
            isNew,
            propertyType: propertyTypeMap[property.property_type] || property.property_type,
            isLocked,
            lat: property.latitude ? Number(property.latitude) : undefined,
            lng: property.longitude ? Number(property.longitude) : undefined,
          }
        })

        setProperties(formattedProperties)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  const handlePropertyClick = (id: string) => {
    router.push(`/properties/${id}`)
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

  const handleApplyFilters = (filters: any) => {
    // 필터 적용 시 매물 재검색
    // 현재는 전체 매물을 로드하고 클라이언트 측에서 필터링하므로
    // PropertySearchSidebar에서 이미 필터링이 이루어짐
    // 필요시 서버 측 필터링을 위해 loadProperties 호출
    loadProperties()
  }

  const handleResetFilters = () => {
    // 필터 초기화 시 전체 매물 다시 로드
    setRadiusSearch({ enabled: false })
    loadProperties()
  }

  const handleDistrictChange = (district: string) => {
    const districtInfo = getDistrictCoordinates(district)
    setMapCenter({ lat: districtInfo.lat, lng: districtInfo.lng })
    setMapLevel(districtInfo.level)
  }

  const handleRadiusSearchChange = (search: {
    enabled: boolean
    centerLat?: number
    centerLng?: number
    radiusKm?: number
  }) => {
    setRadiusSearch(search)
    if (search.enabled && search.centerLat && search.centerLng) {
      setMapCenter({ lat: search.centerLat, lng: search.centerLng })
      setMapLevel(6) // 반경 검색 시 더 확대된 레벨
    }
  }

  const handleQuickRegister = () => {
    if (!isAuthenticated || !user || !['admin', 'agent'].includes(user.role)) {
      alert('매물 등록 권한이 없습니다.')
      return
    }
    setQuickRegisterOpen(true)
  }

  const handleMapClick = (lat: number, lng: number) => {
    // 지도 클릭 시 위치 선택 및 등록 모달 열기 (권한이 있는 경우만)
    if (isAuthenticated && user && ['admin', 'agent'].includes(user.role)) {
      setSelectedLocation({ lat, lng })
      setQuickRegisterOpen(true)
    }
  }

  const handleRegisterSuccess = () => {
    // 매물 등록 성공 시 목록 새로고침
    loadProperties()
  }

  if (loading) {
    return (
      <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">매물을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden h-screen flex flex-col">
      <MapSearchHeader onToggleSidebar={handleToggleSidebar} onQuickRegister={handleQuickRegister} />
      <div className="flex flex-1 overflow-hidden relative">
        <PropertySearchSidebar
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          properties={properties}
          onPropertyClick={handlePropertyClick}
          onDistrictChange={handleDistrictChange}
          onRadiusSearchChange={handleRadiusSearchChange}
          onSearchAddress={handleSearchAddress}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
        <MapView
          onSearchArea={handleSearchArea}
          onMapClick={handleMapClick}
          center={mapCenter}
          level={mapLevel}
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
            }))}
        />
      </div>
      <QuickPropertyRegisterModal
        isOpen={quickRegisterOpen}
        onClose={() => {
          setQuickRegisterOpen(false)
          setSelectedLocation(undefined)
        }}
        initialLocation={selectedLocation}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  )
}

