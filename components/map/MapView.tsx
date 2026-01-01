'use client'

import { useState } from 'react'
import KakaoMap from './KakaoMap'
import { useRouter } from 'next/navigation'

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
}

interface MapViewProps {
  onSearchArea?: (bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void
  markers?: MapMarker[]
  properties?: PropertyMarker[]
  center?: { lat: number; lng: number }
  level?: number
}

export default function MapView({ 
  onSearchArea, 
  markers = [], 
  properties = [],
  center,
  level = 3
}: MapViewProps) {
  const router = useRouter()
  const [mapInstance, setMapInstance] = useState<any>(null)

  // properties를 KakaoMap 형식으로 변환
  const propertyMarkers: PropertyMarker[] = properties.map((prop) => ({
    id: prop.id,
    title: prop.title,
    lat: prop.lat,
    lng: prop.lng,
    type: prop.type,
    deposit: prop.deposit,
    rent: prop.rent,
  }))

  const handleMarkerClick = (propertyId: string) => {
    router.push(`/properties/${propertyId}`)
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
      <KakaoMap
        properties={propertyMarkers}
        onMapReady={handleMapReady}
        onMarkerClick={handleMarkerClick}
        center={center}
        level={level} // 고해상도 지도 (3 = 상세, 낮을수록 확대)
      />

      {/* Floating Search Here Button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={handleSearchAreaClick}
          className="flex items-center gap-2 bg-white dark:bg-[#101622] text-primary px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow font-bold text-sm border border-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          이 지역 찾기
        </button>
      </div>
    </main>
  )
}
