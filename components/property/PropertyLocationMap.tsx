'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

// 카카오 맵 타입 확장
declare global {
  interface Window {
    kakao: any
  }
}

interface PropertyLocationMapProps {
  address?: string
  lat?: number | null
  lng?: number | null
  showDetailedLocation?: boolean
}

export default function PropertyLocationMap({
  address,
  lat,
  lng,
  showDetailedLocation = false,
}: PropertyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [map, setMap] = useState<any>(null)
  const [marker, setMarker] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  // 카카오맵 초기화
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.kakao || !window.kakao.maps) return
    if (!lat || !lng) {
      setError('위치 정보가 없습니다.')
      return
    }

    try {
      // 지도 생성
      const container = mapRef.current
      const options = {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 3, // 확대 레벨 (3 = 상세 지도)
      }

      const kakaoMap = new window.kakao.maps.Map(container, options)
      setMap(kakaoMap)

      // 마커 생성
      const markerPosition = new window.kakao.maps.LatLng(lat, lng)
      const kakaoMarker = new window.kakao.maps.Marker({
        position: markerPosition,
        map: kakaoMap,
      })

      setMarker(kakaoMarker)

      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;white-space:nowrap;">${address || '매물 위치'}</div>`,
      })

      // 마커 클릭 시 인포윈도우 표시
      window.kakao.maps.event.addListener(kakaoMarker, 'click', () => {
        infowindow.open(kakaoMap, kakaoMarker)
      })

      // 지도 로드 완료 후 인포윈도우 자동 표시
      setTimeout(() => {
        infowindow.open(kakaoMap, kakaoMarker)
      }, 500)
    } catch (err: any) {
      console.error('카카오맵 초기화 오류:', err)
      setError('지도를 불러오는 중 오류가 발생했습니다.')
    }
  }, [mapLoaded, lat, lng, address])

  // 카카오맵 스크립트 로드
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      setMapLoaded(true)
      return
    }

    if (!KAKAO_MAP_API_KEY) {
      setError('Kakao Map API 키가 설정되지 않았습니다.')
      return
    }

    // 스크립트가 이미 로드 중인지 확인
    const existingScript = document.querySelector(
      `script[src*="dapi.kakao.com/v2/maps/sdk.js"]`
    )

    if (existingScript) {
      // 스크립트가 이미 있으면 로드 완료 대기
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval)
          setMapLoaded(true)
        }
      }, 100)

      return () => clearInterval(checkInterval)
    }
  }, [KAKAO_MAP_API_KEY])

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-[#111318] dark:text-white">Location</h3>
      <div className="w-full h-[400px] bg-[#f0f2f4] dark:bg-gray-800 rounded-xl overflow-hidden relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">error</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          </div>
        ) : !mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">지도를 불러오는 중...</p>
            </div>
          </div>
        ) : null}
        <div ref={mapRef} className="w-full h-full absolute inset-0" style={{ minHeight: '400px' }} />
      </div>
      {address && (
        <p className="text-sm text-[#616f89] dark:text-gray-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          {address}
        </p>
      )}
      {!showDetailedLocation && (
        <p className="text-sm text-[#616f89] dark:text-gray-400">
          <span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">
            visibility_off
          </span>
          Detailed location is provided after booking a visit for privacy reasons.
        </p>
      )}

      {/* 카카오맵 스크립트 로드 */}
      {!mapLoaded && KAKAO_MAP_API_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false`}
          strategy="lazyOnload"
          onLoad={() => {
            if (window.kakao && window.kakao.maps) {
              window.kakao.maps.load(() => {
                setTimeout(() => {
                  setMapLoaded(true)
                }, 100)
              })
            }
          }}
          onError={() => {
            setError('카카오맵을 불러올 수 없습니다.')
          }}
        />
      )}
    </div>
  )
}

