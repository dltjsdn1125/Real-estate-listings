'use client'

import { useState } from 'react'
import KakaoMap from './KakaoMap'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { addFavorite, removeFavorite, isFavorite } from '@/lib/supabase/favorites'

interface MapMarker {
  id: string
  position: { top: string; left: string }
  type: 'cluster' | 'active' | 'inactive' | 'premium'
  label?: string
  price?: string
  property?: {
    title: string
    type: string
    area: string
    imageUrl: string
    imageAlt: string
  }
}

interface PropertyMarker {
  id: string
  title: string
  lat: number
  lng: number
  type: 'standard' | 'premium'
  deposit?: string
  rent?: string
  location?: string
  area?: string
  imageUrl?: string
  propertyType?: string
}

interface MapViewProps {
  onSearchArea?: (bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void
  onMapClick?: (lat: number, lng: number) => void
  onBoundsChange?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void
  markers?: MapMarker[]
  properties?: PropertyMarker[]
  center?: { lat: number; lng: number }
  level?: number
  pinItMode?: boolean
  onPinItClick?: () => void
  showPinItButton?: boolean
}

export default function MapView({
  onSearchArea,
  onMapClick,
  onBoundsChange,
  markers = [],
  properties = [],
  center,
  level = 3,
  pinItMode = false,
  onPinItClick,
  showPinItButton = false,
}: MapViewProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [selectedProperty, setSelectedProperty] = useState<PropertyMarker | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  // properties를 KakaoMap 형식으로 변환
  const propertyMarkers: PropertyMarker[] = properties.map((prop) => ({
    id: prop.id,
    title: prop.title,
    lat: prop.lat,
    lng: prop.lng,
    type: prop.type,
    deposit: prop.deposit,
    rent: prop.rent,
    location: prop.location,
    area: prop.area,
    imageUrl: prop.imageUrl,
    propertyType: prop.propertyType,
  }))

  const handleMarkerClick = async (propertyId: string) => {
    // 매물 정보 찾기
    const property = propertyMarkers.find(p => p.id === propertyId)
    if (property) {
      setSelectedProperty(property)
      // 즐겨찾기 상태 확인
      if (isAuthenticated && user) {
        const favorited = await isFavorite(user.id, propertyId)
        setIsFavorited(favorited)
      }
    }
  }

  const handleClosePopup = () => {
    setSelectedProperty(null)
    setIsFavorited(false)
  }

  const handleViewDetail = () => {
    if (selectedProperty) {
      router.push(`/properties/${selectedProperty.id}`)
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !user || !selectedProperty) {
      alert('로그인이 필요합니다.')
      return
    }

    setFavoriteLoading(true)
    try {
      if (isFavorited) {
        await removeFavorite(user.id, selectedProperty.id)
        setIsFavorited(false)
      } else {
        await addFavorite(user.id, selectedProperty.id)
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
      alert('즐겨찾기 처리 중 오류가 발생했습니다.')
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleMapReady = (map: any) => {
    setMapInstance(map)
  }

  const handleSearchAreaClick = () => {
    if (!mapInstance) {
      onSearchArea?.()
      return
    }

    // 현재 지도 영역의 경계 좌표 가져오기
    const bounds = mapInstance.getBounds()
    const sw = bounds.getSouthWest() // 남서쪽 좌표
    const ne = bounds.getNorthEast() // 북동쪽 좌표

    onSearchArea?.({
      sw: { lat: sw.getLat(), lng: sw.getLng() },
      ne: { lat: ne.getLat(), lng: ne.getLng() },
    })
  }

  return (
    <main className="flex-1 relative bg-gray-200 dark:bg-gray-800 h-full w-full overflow-hidden">
      {/* Kakao Map */}
      <div className="absolute inset-0 w-full h-full">
        <KakaoMap
          properties={propertyMarkers}
          onMapReady={handleMapReady}
          onMarkerClick={handleMarkerClick}
          onMapClick={(lat, lng) => {
            handleClosePopup()
            onMapClick?.(lat, lng)
          }}
          onBoundsChange={onBoundsChange}
          center={center}
          level={level}
          pinItMode={pinItMode}
          onPinItClick={onPinItClick}
          showPinItButton={showPinItButton}
        />
      </div>

      {/* 매물 상세 팝업 */}
      {selectedProperty && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            {/* 닫기 버튼 */}
            <button
              onClick={handleClosePopup}
              className="absolute top-2 right-2 z-10 size-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* 이미지 영역 */}
            {selectedProperty.imageUrl && (
              <div className="relative h-32 bg-gray-200 dark:bg-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedProperty.imageUrl}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover"
                />
                {selectedProperty.type === 'premium' && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                    PREMIUM
                  </div>
                )}
              </div>
            )}

            {/* 정보 영역 */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-[#111318] dark:text-white text-base line-clamp-1">
                    {selectedProperty.title}
                  </h3>
                  {selectedProperty.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedProperty.location}
                    </p>
                  )}
                </div>
                {selectedProperty.propertyType && (
                  <span className="shrink-0 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    {selectedProperty.propertyType}
                  </span>
                )}
              </div>

              {/* 가격 정보 */}
              <div className="flex items-center gap-3 mb-3">
                {selectedProperty.deposit && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">보증금</span>
                    <p className="font-bold text-primary">{selectedProperty.deposit}</p>
                  </div>
                )}
                {selectedProperty.rent && selectedProperty.rent !== '0' && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">월세</span>
                    <p className="font-bold text-[#111318] dark:text-white">{selectedProperty.rent}</p>
                  </div>
                )}
                {selectedProperty.area && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">면적</span>
                    <p className="font-bold text-[#111318] dark:text-white">{selectedProperty.area}</p>
                  </div>
                )}
              </div>

              {/* 버튼 영역 */}
              <div className="flex gap-2">
                <button
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  className={`flex-1 h-10 rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition-colors ${
                    isFavorited
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-500 border border-red-200 dark:border-red-800'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isFavorited ? 'favorite' : 'favorite_border'}
                  </span>
                  {favoriteLoading ? '...' : isFavorited ? '즐겨찾기 됨' : '즐겨찾기'}
                </button>
                <button
                  onClick={handleViewDetail}
                  className="flex-1 h-10 rounded-lg bg-primary text-white font-medium text-sm flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  자세히 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
