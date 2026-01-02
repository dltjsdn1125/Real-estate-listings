'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    kakao: any
  }
}

interface KakaoAerialViewProps {
  latitude: number
  longitude: number
  width?: string
  height?: string
  className?: string
}

export default function KakaoAerialView({
  latitude,
  longitude,
  width = '100%',
  height = '400px',
  className = '',
}: KakaoAerialViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  // 지도 초기화
  useEffect(() => {
    if (!mapLoaded || !containerRef.current || !window.kakao || !window.kakao.maps) return

    try {
      setLoading(true)
      setError(null)

      // 기존 지도가 있으면 제거
      if (mapRef.current) {
        mapRef.current = null
      }

      // 지도 생성 (항공뷰 타입)
      const mapOption = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: 3, // 확대 레벨
        mapTypeId: window.kakao.maps.MapTypeId.HYBRID, // 항공뷰 + 지도
      }

      const map = new window.kakao.maps.Map(containerRef.current, mapOption)
      mapRef.current = map

      // 마커 추가
      const markerPosition = new window.kakao.maps.LatLng(latitude, longitude)
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
      })
      marker.setMap(map)

      // 인포윈도우 추가
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: '<div style="padding:5px;font-size:12px;color:#2563eb;">위치</div>',
      })
      infoWindow.open(map, marker)

      setError(null)
      setLoading(false)
    } catch (err: any) {
      console.error('❌ KakaoAerialView - 초기화 오류:', err)
      setError('항공뷰를 불러오는 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }, [mapLoaded, latitude, longitude])

  // 지도 리사이즈 처리
  useEffect(() => {
    if (mapRef.current && containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.relayout()
        }
      })
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [mapLoaded])

  // Kakao Maps API 로드 확인
  useEffect(() => {
    // 이미 로드되어 있으면 바로 초기화
    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
      setMapLoaded(true)
      return
    }

    // 로드되지 않았으면 대기
    if (!KAKAO_MAP_API_KEY) {
      setError('Kakao Map API 키가 설정되지 않았습니다.')
      setLoading(false)
      return
    }

    // Script가 이미 로드 중이거나 로드된 경우 대기
    const checkInterval = setInterval(() => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
        clearInterval(checkInterval)
        setMapLoaded(true)
      }
    }, 100)

    // 최대 10초 대기
    setTimeout(() => {
      clearInterval(checkInterval)
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.Map) {
        setError('Kakao Map API를 로드할 수 없습니다.')
        setLoading(false)
      }
    }, 10000)
  }, [KAKAO_MAP_API_KEY])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width, height, minHeight: height, position: 'relative' }}
    >
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700">
          <div className="text-center p-4">
            <span className="material-symbols-outlined text-4xl text-blue-500 dark:text-blue-400 mb-2">
              map
            </span>
            <p className="text-sm text-blue-600 dark:text-blue-400">{error}</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-lg overflow-hidden bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 relative" style={{ width: '100%', height: '100%' }}>
          {/* 항공뷰가 로드되는 동안 로딩 표시 */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-blue-100 dark:bg-blue-900/20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
                <p className="text-sm text-blue-600 dark:text-blue-400">항공뷰를 불러오는 중...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

