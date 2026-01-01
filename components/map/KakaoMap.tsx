'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    kakao: any
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

interface KakaoMapProps {
  properties?: PropertyMarker[]
  onMapReady?: (map: any) => void
  onMarkerClick?: (propertyId: string) => void
  center?: { lat: number; lng: number }
  level?: number // 지도 확대/축소 레벨 (1-14, 높을수록 확대)
}

export default function KakaoMap({
  properties = [],
  onMapReady,
  onMarkerClick,
  center,
  level = 3, // 기본 레벨 (대구 전체 보기)
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [markers, setMarkers] = useState<any[]>([])
  const [clusterer, setClusterer] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [userMarker, setUserMarker] = useState<any>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  
  // 모바일 감지 (SSR 안전)
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  // 사용자 위치 마커 업데이트 함수
  const updateUserMarker = useCallback((location: { lat: number; lng: number }) => {
    if (!map || !window.kakao) return

    // 기존 마커 제거
    setUserMarker((prevMarker) => {
      if (prevMarker) {
        prevMarker.setMap(null)
      }
      return null
    })

    // 새로운 마커 생성 (사용자 위치 표시)
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(location.lat, location.lng),
      title: '내 위치',
      image: new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
        new window.kakao.maps.Size(24, 35),
        { offset: new window.kakao.maps.Point(12, 35) }
      ),
      zIndex: 1000, // 다른 마커보다 위에 표시
    })

    marker.setMap(map)
    setUserMarker(marker)
  }, [map])

  // GPS 위치 추적 (사용자 제스처 후에만 활성화)
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('GPS를 지원하지 않는 브라우저입니다.')
      // 기본 좌표 설정
      setUserLocation({ lat: 35.8714, lng: 128.6014 })
      return
    }

    // 모바일에서는 더 정확한 GPS 설정 사용
    const options: PositionOptions = {
      enableHighAccuracy: true, // 고정확도 GPS 활성화 (모바일에서 필수)
      timeout: isMobile ? 30000 : 20000, // 모바일: 30초, 데스크톱: 20초
      maximumAge: isMobile ? 0 : 60000, // 모바일: 캐시 사용 안 함 (항상 최신 위치), 데스크톱: 1분
    }

    const updateLocation = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      
      // 정확도가 너무 낮으면 (100m 이상) 개발 환경에서만 경고
      if (accuracy > 100 && process.env.NODE_ENV === 'development') {
        console.warn(`GPS 정확도가 낮습니다: ${Math.round(accuracy)}m`)
      }
      
      const newLocation = { lat: latitude, lng: longitude }
      setUserLocation(newLocation)
      setLocationError(null)

      // 지도가 있으면 사용자 위치 마커 업데이트
      if (map && window.kakao) {
        updateUserMarker(newLocation)
      }
    }

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = ''
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = '위치 정보 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = '위치 정보를 사용할 수 없습니다.'
          break
        case error.TIMEOUT:
          errorMessage = '위치 정보 요청 시간이 초과되었습니다.'
          break
        default:
          errorMessage = '위치 정보를 가져오는 중 오류가 발생했습니다.'
          break
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('위치 정보 오류:', errorMessage, error)
      }
      setLocationError(errorMessage)
      
      // 오류 발생 시 기본 좌표 사용
      const defaultLocation = { lat: 35.8714, lng: 128.6014 }
      setUserLocation(defaultLocation)
      
      if (map && window.kakao) {
        updateUserMarker(defaultLocation)
      }
    }

    // 모바일: watchPosition으로 지속 추적
    if (isMobile) {
      // 기존 watchPosition 정리
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
      
      const id = navigator.geolocation.watchPosition(
        updateLocation,
        handleError,
        options
      )
      setWatchId(id)
    } else {
      // 데스크톱: getCurrentPosition으로 한 번만
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        handleError,
        options
      )
    }
  }, [map, isMobile, updateUserMarker, watchId])

  // 지도가 준비되면 사용자에게 위치 요청 옵션 제공 (자동 요청 안 함)
  useEffect(() => {
    if (map && !userLocation) {
      // 기본 좌표만 설정 (대구 중심)
      setUserLocation({ lat: 35.8714, lng: 128.6014 })
    }
  }, [map, userLocation])

  // 지도 초기화
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.kakao || map) return // 이미 지도가 생성되었으면 리턴

    // 중심 좌표 결정 (우선순위: props center > GPS 위치 > 대구 중심)
    const defaultCenter = center || userLocation || { lat: 35.8714, lng: 128.6014 }

    // 고해상도 지도 옵션
    const mapOption = {
      center: new window.kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
      level: level, // 지도 확대/축소 레벨 (3-14, 낮을수록 확대)
    }

    // 지도 생성
    const kakaoMap = new window.kakao.maps.Map(mapRef.current, mapOption)
    setMap(kakaoMap)

    // 마커 클러스터러 생성
    const markerClusterer = new window.kakao.maps.MarkerClusterer({
      map: kakaoMap,
      averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치로 클러스터 마커 위치 설정
      minLevel: 5, // 클러스터 할 최소 지도 레벨 (5 이상일 때 클러스터링)
      disableClickZoom: false, // 클러스터 마커 클릭 시 지도 확대 활성화
      styles: [
        {
          // 클러스터 마커 스타일
          width: '50px',
          height: '50px',
          background: 'rgba(255, 107, 0, 0.8)',
          borderRadius: '25px',
          color: '#fff',
          textAlign: 'center',
          fontWeight: 'bold',
          lineHeight: '50px',
        },
      ],
    })
    setClusterer(markerClusterer)

    // 지도 타입 설정 (일반 지도 + 지형도 혼합 가능)
    // kakaoMap.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP) // 기본 도로 지도
    // kakaoMap.setMapTypeId(window.kakao.maps.MapTypeId.HYBRID) // 위성 + 도로명

    // 지도 준비 완료 콜백
    onMapReady?.(kakaoMap)

    // 사용자 위치 마커 추가
    if (userLocation && !locationError && map) {
      updateUserMarker(userLocation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded])

  // 지도가 준비되면 사용자 위치 마커 표시
  useEffect(() => {
    if (map && userLocation && !locationError) {
      updateUserMarker(userLocation)
    }
  }, [map, userLocation, locationError, updateUserMarker])

  // 컴포넌트 언마운트 시 watchPosition 정리
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  // center 또는 level이 변경되면 지도 이동 (외부에서 제어)
  useEffect(() => {
    if (!map || !window.kakao) return
    
    // center가 정의되어 있을 때만 지도 이동
    if (center) {
      const moveLatLon = new window.kakao.maps.LatLng(center.lat, center.lng)
      map.panTo(moveLatLon) // 부드럽게 이동
    }
    
    // level이 정의되어 있을 때만 확대 레벨 변경
    if (level !== undefined && level !== map.getLevel()) {
      map.setLevel(level) // 확대 레벨 변경
    }
  }, [map, center, level])

  // 매물 마커 표시 (클러스터링 적용)
  useEffect(() => {
    if (!map || !window.kakao || !clusterer || properties.length === 0) return

    // 기존 마커 제거
    clusterer.clear()
    const newMarkers: any[] = []

    // 매물 마커 생성 (기본 마커 사용, 프리미엄은 라벨로 구분)
    properties.forEach((property) => {
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(property.lat, property.lng),
        title: property.title,
      })

      // 마커 클릭 이벤트
      if (onMarkerClick) {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onMarkerClick(property.id)
        })
      }

      // 인포윈도우 생성 (호버 시 표시)
      const isPremium = property.type === 'premium'
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;min-width:120px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
          <div style="font-weight:bold;margin-bottom:4px;color:#111;${isPremium ? 'color:#ff6b00;' : ''}">${property.title}${isPremium ? ' ⭐' : ''}</div>
          ${property.deposit && property.rent ? `<div style="color:#666;">${property.deposit} / ${property.rent}</div>` : ''}
        </div>`,
      })

      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.open(map, marker)
      })

      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close()
      })

      newMarkers.push(marker)
    })

    // 클러스터러에 마커 추가
    clusterer.addMarkers(newMarkers)
    setMarkers(newMarkers)

    // 모든 마커가 보이도록 지도 범위 조정
    if (properties.length > 0 && !center) {
      const bounds = new window.kakao.maps.LatLngBounds()
      properties.forEach((property) => {
        bounds.extend(new window.kakao.maps.LatLng(property.lat, property.lng))
      })
      map.setBounds(bounds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, clusterer, properties, onMarkerClick, center])

  // GPS 위치로 지도 이동
  const moveToUserLocation = () => {
    if (!map || !userLocation) {
      alert('위치 정보를 사용할 수 없습니다.')
      return
    }

    const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
    map.setCenter(moveLatLon)
    map.setLevel(3) // 확대 레벨 (3 = 상세 지도)
  }

  return (
    <>
      {KAKAO_MAP_API_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=clusterer&autoload=false`}
          strategy="afterInteractive"
          onLoad={() => {
            if (window.kakao && window.kakao.maps) {
              window.kakao.maps.load(() => {
                setMapLoaded(true)
              })
            }
          }}
          onError={(e) => {
            console.error('Kakao Map 로드 실패. Kakao Developers에서 플랫폼 도메인을 확인하세요:', e)
          }}
        />
      )}
      <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
        {!KAKAO_MAP_API_KEY ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
              <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
              <h3 className="text-xl font-bold mb-2">Kakao Map API 키가 설정되지 않았습니다</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                .env.local 파일에 NEXT_PUBLIC_KAKAO_MAP_API_KEY를 추가하세요.
              </p>
              <a 
                href="https://developers.kakao.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Kakao Developers에서 키 발급 →
              </a>
            </div>
          </div>
        ) : !mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">지도를 불러오는 중...</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                오래 걸린다면 F12를 눌러 콘솔을 확인하세요
              </p>
            </div>
          </div>
        ) : null}
        <div ref={mapRef} className="w-full h-full" />
        
        {/* GPS 위치 이동 버튼 (항상 표시, 클릭 시 GPS 요청) */}
        <button
          onClick={moveToUserLocation}
          className="absolute bottom-24 right-4 z-10 size-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={userLocation ? "내 위치로 이동" : "내 위치 찾기"}
        >
          <span className="material-symbols-outlined text-2xl">my_location</span>
        </button>

        {/* 위치 오류 메시지 */}
        {locationError && (
          <div className="absolute top-4 left-4 z-10 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg text-sm">
            {locationError}
          </div>
        )}

        {/* 지도 컨트롤 */}
        <div className="absolute right-4 bottom-8 flex flex-col gap-2 z-10">
          <button
            onClick={() => map?.setLevel((map.getLevel() || 3) + 1)}
            className="size-10 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="확대"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
          <button
            onClick={() => map?.setLevel((map.getLevel() || 3) - 1)}
            className="size-10 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="축소"
          >
            <span className="material-symbols-outlined">remove</span>
          </button>
        </div>
      </div>
    </>
  )
}

