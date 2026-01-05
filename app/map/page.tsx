'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { searchPlacesByKeyword, PlaceSearchResult } from '@/lib/utils/geocoding'
import { REGION_SETTINGS, MAJOR_CITIES, REGION_SETTING_KEY, RegionType } from '@/lib/constants/regionSettings'
import { canViewBlurred } from '@/lib/utils/blurPermission'

interface PropertyForMap {
  id: string
  title: string
  location: string
  address?: string | null
  district?: string
  dong?: string
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

function MapPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isApproved, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [properties, setProperties] = useState<PropertyForMap[]>([])
  const [loading, setLoading] = useState(true)
  const [userTier, setUserTier] = useState<string>('bronze')
  const [canViewBlurredState, setCanViewBlurredState] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [mapLevel, setMapLevel] = useState<number>(8)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null)
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
  // 카카오 Places 검색 결과 (대구 지역 상호/주소)
  const [placeSearchResults, setPlaceSearchResults] = useState<PlaceSearchResult[]>([])
  // 지역 설정 (기본값: 대구)
  const [regionSetting, setRegionSetting] = useState<{ type: RegionType; customCity?: string }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(REGION_SETTING_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return { type: 'daegu' }
        }
      }
    }
    return { type: 'daegu' }
  })

  // 검색 실행 중 플래그 (중복 실행 방지)
  const isSearchingRef = useRef(false)
  // 마운트 상태 추적
  const isMountedRef = useRef(true)

  // Pin it 버튼 표시 여부 계산
  const canShowPinIt = isAuthenticated && user && (
    (user.tier && ['bronze', 'silver', 'gold', 'platinum', 'premium'].includes(user.tier)) ||
    user.role === 'admin' ||
    user.role === 'agent'
  )

  // 블러 권한 확인
  useEffect(() => {
    const checkBlurPermission = async () => {
      if (user) {
        const canView = await canViewBlurred(user)
        setCanViewBlurredState(canView)
      } else {
        setCanViewBlurredState(false)
      }
    }
    checkBlurPermission()
  }, [user])

  // 지역 설정 변경 시 localStorage 저장 및 지도 중심 이동
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REGION_SETTING_KEY, JSON.stringify(regionSetting))
    }

    // 지역 설정에 따라 지도 중심 이동
    if (regionSetting.type === 'daegu') {
      const daegu = REGION_SETTINGS.daegu
      setMapCenter({ lat: daegu.lat, lng: daegu.lng })
      setMapLevel(daegu.level)
    } else if (regionSetting.type === 'nationwide') {
      const nationwide = REGION_SETTINGS.nationwide
      setMapCenter({ lat: nationwide.lat, lng: nationwide.lng })
      setMapLevel(nationwide.level)
    } else if (regionSetting.type === 'custom' && regionSetting.customCity) {
      const city = MAJOR_CITIES.find(c => c.name === regionSetting.customCity)
      if (city) {
        setMapCenter({ lat: city.lat, lng: city.lng })
        setMapLevel(city.level)
      }
    }
  }, [regionSetting])

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

  // 컴포넌트 언마운트 시 플래그 설정
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 쿼리 파라미터에서 검색 키워드 읽기 (useSearchParams 사용)
  useEffect(() => {
    const keyword = searchParams.get('keyword')
    if (keyword && keyword.trim() && keyword.trim() !== searchKeyword) {
      // 이미 검색 중이면 스킵
      if (isSearchingRef.current) {
        return
      }
      // 검색 키워드가 있으면 자동으로 검색 실행
      const trimmedKeyword = keyword.trim()
      setSearchKeyword(trimmedKeyword)
      handleKeywordSearch(trimmedKeyword).catch(err => {
        if (isMountedRef.current) {
          console.error('검색 실행 오류:', err)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // searchParams가 변경될 때마다 실행

  // BFCache(뒤로가기/앞으로가기 캐시) 복원 시 상태 다시 로드
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // persisted가 true면 BFCache에서 복원된 페이지
        if (event.persisted) {
        console.log('BFCache에서 페이지 복원됨, 상태 재로드')
        // 이미 검색 중이면 스킵
        if (isSearchingRef.current) {
          return
        }
        // URL에서 검색 키워드 읽기 (searchParams 사용)
        const keyword = searchParams.get('keyword')
        if (keyword && keyword.trim()) {
          // 검색 키워드가 있으면 다시 검색
          const trimmedKeyword = keyword.trim()
          if (trimmedKeyword !== searchKeyword) {
            setSearchKeyword(trimmedKeyword)
          }
          // 검색 실행 (함수 직접 호출)
          handleKeywordSearch(trimmedKeyword).catch(err => {
            if (isMountedRef.current) {
              console.error('검색 재실행 오류:', err)
            }
          })
        } else {
          // 키워드 없으면 매물만 다시 로드
          loadProperties().catch(err => {
            if (isMountedRef.current) {
              console.error('매물 로드 오류:', err)
            }
          })
        }
        // 사이드바 열기 (검색 결과 표시를 위해)
        setSidebarOpen(true)
      }
    }

    // focus 이벤트도 처리 (뒤로가기 후 포커스 복원 시)
    const handleFocus = () => {
      // 이미 검색 중이면 스킵
      if (isSearchingRef.current) {
        return
      }
      // URL 파라미터와 상태 동기화 (searchParams 사용)
      const keyword = searchParams.get('keyword')
      if (keyword && keyword.trim() && keyword.trim() !== searchKeyword) {
        const trimmedKeyword = keyword.trim()
        setSearchKeyword(trimmedKeyword)
        handleKeywordSearch(trimmedKeyword).catch(err => {
          if (isMountedRef.current) {
            console.error('검색 재실행 오류:', err)
          }
        })
      } else if (!keyword && searchKeyword) {
        // URL에 키워드가 없는데 상태에 있으면 초기화
        setSearchKeyword('')
        setPlaceSearchResults([])
        loadProperties().catch(err => {
          if (isMountedRef.current) {
            console.error('매물 로드 오류:', err)
          }
        })
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, searchKeyword]) // searchParams와 searchKeyword를 의존성에 추가

  useEffect(() => {
    // 매물 로드 (승인된 사용자 또는 비로그인 사용자)
    // 맵은 항상 표시되어야 하므로 매물 로딩과 분리
    // searchKeyword는 클라이언트 필터링만 사용하므로 dependency에서 제거 (DB 재호출 불필요)
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
  }, [radiusSearch, authLoading, isApproved, isAuthenticated])

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
        limit: 1000, // 관리자 페이지와 동일하게 모든 매물 로드 (클라이언트 필터링)
      }
      
      // 키워드 검색은 DB에서 하지 않고 클라이언트에서 필터링 (관리자 페이지와 동일)
      // filters.keyword는 사용하지 않음 - 클라이언트 측 필터링만 사용
      
      // 반경 검색 파라미터 추가
      if (radiusSearch.enabled && radiusSearch.centerLat && radiusSearch.centerLng && radiusSearch.radiusKm) {
        filters.centerLat = radiusSearch.centerLat
        filters.centerLng = radiusSearch.centerLng
        filters.radiusKm = radiusSearch.radiusKm
      }
      
      // 타임아웃 설정 (90초로 증가 - 키워드 검색 및 복잡한 쿼리 시 더 오래 걸릴 수 있음)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('매물을 불러오는 데 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.')), 90000)
      })
      
      // 디버깅: 검색 전 로그
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 매물 로드 시작 (관리자 페이지와 동일 - 모든 매물 로드 후 클라이언트 필터링):', {
          filters: JSON.stringify(filters, null, 2)
        })
      }

      const result = await Promise.race([
        getProperties(filters),
        timeoutPromise
      ])
      
      const { data, error: fetchError } = result

      // 디버깅: 매물 로드 결과 확인
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 매물 로드 완료 (클라이언트 필터링 사용):', {
          resultCount: data?.length || 0,
          error: fetchError?.message || null,
          hasData: !!data,
          firstItem: data?.[0] ? { id: data[0].id, title: data[0].title } : null
        })
      }

      if (fetchError) {
        // 타임아웃 오류인 경우 명확한 메시지 표시
        if (fetchError.message?.includes('시간이 너무 오래 걸립니다')) {
          throw fetchError
        }
        // 기타 오류는 상세 메시지 포함
        console.error('매물 로딩 오류:', fetchError)
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

          // 블러 처리 여부 확인
          const isBlurred = property.is_blurred || false
          
          return {
            id: property.id,
            title: property.title,
            location,
            address: property.address || null,
            district: property.district || undefined,
            dong: property.dong || undefined,
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
            isBlurred,
            canViewBlurred: canViewBlurredState,
            imageUrl,
            imageAlt,
          }
        })

        setProperties(formattedProperties)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 매물 로드 완료 (클라이언트 필터링 사용):', {
            total: formattedProperties.length
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
    // 검색된 주소로 지도 이동 및 마커 표시
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 위치 보기 클릭:', address, coords)
    }
    setMapCenter({ lat: coords.lat, lng: coords.lng })
    setMapLevel(3) // 상세 레벨로 확대
    setSelectedLocation({ lat: coords.lat, lng: coords.lng, address }) // 선택된 위치 저장
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
    setPlaceSearchResults([]) // 카카오 Places 검색 결과도 초기화
    
    // URL에서 검색 키워드 제거
    const currentParams = new URLSearchParams(window.location.search)
    currentParams.delete('keyword')
    const newUrl = `${window.location.pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`
    router.replace(newUrl, { scroll: false })
    
    loadPropertiesWithFilters()
  }

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleKeywordSearch = async (keyword: string) => {
    // 키워드 검색 수행
    if (keyword && keyword.trim()) {
      const trimmedKeyword = keyword.trim()

      // 이미 검색 중이면 스킵
      if (isSearchingRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 검색 이미 실행 중, 스킵:', trimmedKeyword)
        }
        return
      }

      // 검색 시작 플래그 설정
      isSearchingRef.current = true

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 handleKeywordSearch 호출:', trimmedKeyword)
      }

      // 컴포넌트가 마운트되어 있지 않으면 중단
      if (!isMountedRef.current) {
        isSearchingRef.current = false
        return
      }

      // 검색 시작 시 이전 Places 검색 결과만 초기화 (DB 매물은 유지)
      setPlaceSearchResults([])
      setSearchKeyword(trimmedKeyword) // 클라이언트 필터링을 위한 키워드 설정
      // DB 재로드 불필요 - 이미 모든 매물이 로드되어 있고 클라이언트에서 필터링됨
      setError(null)
      setSidebarOpen(true) // 검색 시 사이드바 열기
      setSidebarTab('search') // 검색 탭으로 전환

      // URL에 검색 키워드 저장 (페이지 이동 후 돌아와도 검색 결과 유지)
      const currentParams = new URLSearchParams(window.location.search)
      if (trimmedKeyword) {
        currentParams.set('keyword', trimmedKeyword)
      } else {
        currentParams.delete('keyword')
      }
      const newUrl = `${window.location.pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`
      router.replace(newUrl, { scroll: false })

      try {
        // 1. 카카오 Places API로 실제 상호/주소 검색 (우선)
        // 지역 설정에 따라 검색 키워드 조정
        let searchKeyword = trimmedKeyword
        if (regionSetting.type === 'daegu') {
          // 대구 지역 검색: 키워드에 대구 추가
          searchKeyword = trimmedKeyword.includes('대구') ? trimmedKeyword : `대구 ${trimmedKeyword}`
        } else if (regionSetting.type === 'custom' && regionSetting.customCity) {
          // 사용자 지정 도시 검색: 키워드에 도시명 추가
          searchKeyword = trimmedKeyword.includes(regionSetting.customCity) ? trimmedKeyword : `${regionSetting.customCity} ${trimmedKeyword}`
        }
        // 전국 검색은 키워드 그대로 사용

        // 컴포넌트 언마운트 체크
        if (!isMountedRef.current) {
          isSearchingRef.current = false
          return
        }

        console.log('🔍 Places 검색 시작:', { original: trimmedKeyword, searchKeyword, region: regionSetting.type })
        const placeResults = await searchPlacesByKeyword(searchKeyword, { size: 30 })

        // 컴포넌트 언마운트 체크 (비동기 작업 후)
        if (!isMountedRef.current) {
          isSearchingRef.current = false
          return
        }

        console.log('🔍 Places 검색 완료:', {
          keyword: trimmedKeyword,
          resultCount: placeResults.length,
          results: placeResults.slice(0, 5).map(p => ({
            name: p.name,
            address: p.address || p.roadAddress,
            lat: p.lat,
            lng: p.lng
          }))
        })

        setPlaceSearchResults(placeResults)
        
        // 디버깅: 검색 결과 상태 확인
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 placeSearchResults state 업데이트:', placeResults.length, '개')
          if (placeResults.length > 0) {
            console.log('🔍 검색 결과 상세:', placeResults.slice(0, 3))
          }
        }

        // 검색 결과가 있으면 첫 번째 결과 위치로 지도 이동
        if (placeResults && placeResults.length > 0) {
          setMapCenter({ lat: placeResults[0].lat, lng: placeResults[0].lng })
          setMapLevel(4) // 상세 레벨로 확대
        }
        
        // DB 재로드 불필요 - 이미 모든 매물이 로드되어 있고 클라이언트에서 필터링됨
        // 관리자 페이지와 동일: 모든 매물 로드 후 클라이언트 측 필터링만 수행

        // 키워드 검색 시 즐겨찾기 모달 자동 열기 제거 (검색 결과 우선 표시)
      } catch (error) {
        if (isMountedRef.current) {
          console.error('검색 오류:', error)
          setError('검색 중 오류가 발생했습니다.')
        }
      } finally {
        // 검색 완료 플래그 해제
        isSearchingRef.current = false
      }
    } else {
      // 빈 키워드면 검색 결과 초기화
      setPlaceSearchResults([])
      setSearchKeyword('')
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

  // MapView에 전달할 properties를 메모이제이션 (무한 루프 방지)
  // DB 매물 + 카카오 Places 검색 결과를 합쳐서 전달
  const mapProperties = useMemo(() => {
    // DB 매물
    const dbProperties = properties
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
      }))

    // 카카오 Places 검색 결과를 마커 형식으로 변환
    const placeMarkers = placeSearchResults.map((place) => ({
      id: `place-${place.id}`,
      title: place.name,
      lat: place.lat,
      lng: place.lng,
      type: 'standard' as const,
      deposit: '',
      rent: '',
      location: place.address,
      area: '',
      propertyType: place.category?.split(' > ').pop() || '장소', // 카테고리에서 마지막 항목
    }))

    // DB 매물과 Places 결과 합치기 (DB 매물 우선)
    return [...dbProperties, ...placeMarkers]
  }, [properties, placeSearchResults])

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
          placeSearchResults={placeSearchResults}
          searchKeyword={searchKeyword}
          regionSetting={regionSetting}
          onRegionSettingChange={setRegionSetting}
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
            onPinItClick={handlePinIt}
            showPinItButton={!!canShowPinIt}
            properties={mapProperties}
            selectedLocation={selectedLocation}
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
            <div className="absolute top-14 sm:top-20 left-1/2 -translate-x-1/2 w-auto z-30 bg-primary text-white px-3 sm:px-6 py-1.5 sm:py-3 rounded-lg shadow-xl flex items-center gap-2 sm:gap-3 animate-pulse">
              <span className="material-symbols-outlined text-[18px] sm:text-[24px] shrink-0">push_pin</span>
              <p className="text-xs sm:text-sm font-medium whitespace-nowrap">{pinItMessage}</p>
              <button
                onClick={() => {
                  setPinItMode(false)
                  setPinItMessage(null)
                }}
                className="shrink-0 hover:bg-white/20 rounded-full p-0.5 sm:p-1 transition-colors"
                title="취소"
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">close</span>
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

// 동적 렌더링 강제 (캐시 방지)
export const dynamic = 'force-dynamic'

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display overflow-hidden h-screen flex flex-col items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  )
}
