'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

// 카카오 맵 타입 확장
declare global {
  interface Window {
    kakao: any
  }
}

interface KakaoRoadViewProps {
  latitude: number
  longitude: number
  width?: string
  height?: string
  className?: string
}

export default function KakaoRoadView({
  latitude,
  longitude,
  width = '100%',
  height = '400px',
  className = '',
}: KakaoRoadViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const roadviewRef = useRef<any>(null)
  const [roadviewLoaded, setRoadviewLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  // 로드뷰 초기화 (문서에 맞게 단순화)
  useEffect(() => {
    if (!roadviewLoaded || !containerRef.current || !window.kakao || !window.kakao.maps) return

    // 필수 API 확인
    if (!window.kakao.maps.Roadview || !window.kakao.maps.RoadviewClient || !window.kakao.maps.LatLng) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ KakaoRoadView - 필수 API가 없습니다:', {
          hasRoadview: !!window.kakao.maps.Roadview,
          hasRoadviewClient: !!window.kakao.maps.RoadviewClient,
          hasLatLng: !!window.kakao.maps.LatLng,
        })
      }
      setError('로드뷰 API를 사용할 수 없습니다.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 기존 로드뷰가 있으면 제거하지 않고 재사용
      let roadview = roadviewRef.current
      if (!roadview) {
        // 문서에 따르면 간단하게 생성
        // var roadviewContainer = document.getElementById('roadview');
        // var roadview = new kakao.maps.Roadview(roadviewContainer);
        roadview = new window.kakao.maps.Roadview(containerRef.current)
        roadviewRef.current = roadview
      } else {
        // 기존 로드뷰가 있으면 relayout만 호출
        roadview.relayout()
      }

      // var roadviewClient = new kakao.maps.RoadviewClient();
      const roadviewClient = new window.kakao.maps.RoadviewClient()

      // var position = new kakao.maps.LatLng(33.450701, 126.570667);
      const position = new window.kakao.maps.LatLng(latitude, longitude)

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 KakaoRoadView - 초기화 시작:', { 
          lat: latitude, 
          lng: longitude,
          position: position.toString()
        })
      }

      // 타임아웃 설정 (3초로 단축)
      const timeoutId = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ KakaoRoadView - 타임아웃')
        }
        setError('로드뷰를 불러오는 데 시간이 너무 오래 걸립니다.')
        setLoading(false)
      }, 3000)

      // roadviewClient.getNearestPanoId(position, 50, function(panoId) {
      //     roadview.setPanoId(panoId, position);
      // });
      // 반경을 200m로 확대하여 더 넓은 범위에서 로드뷰 검색
      roadviewClient.getNearestPanoId(position, 200, (panoId: number) => {
        clearTimeout(timeoutId)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 KakaoRoadView - getNearestPanoId 콜백:', { panoId, isValid: panoId && panoId > 0 })
        }
        if (panoId && panoId > 0) {
          try {
            roadview.setPanoId(panoId, position)
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ KakaoRoadView - 로드뷰 설정 완료:', { panoId })
            }
            setError(null)
            setLoading(false)
          } catch (setPanoError: any) {
            console.error('❌ KakaoRoadView - 파노라마 ID 설정 오류:', setPanoError)
            setError('로드뷰 위치를 설정할 수 없습니다.')
            setLoading(false)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ KakaoRoadView - 로드뷰가 없는 위치:', { lat: latitude, lng: longitude })
          }
          setError('이 위치의 로드뷰를 사용할 수 없습니다.')
          setLoading(false)
        }
      })
    } catch (err: any) {
      console.error('❌ KakaoRoadView - 초기화 오류:', err)
      setError('로드뷰를 불러오는 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }, [roadviewLoaded, latitude, longitude])

  // 로드뷰 리사이즈 처리
  useEffect(() => {
    if (roadviewRef.current && containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (roadviewRef.current) {
          roadviewRef.current.relayout()
        }
      })
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [roadviewLoaded])

  // Kakao Maps API가 이미 로드되어 있는지 확인
  useEffect(() => {
    // 이미 로드되어 있으면 바로 초기화
    if (window.kakao && window.kakao.maps && window.kakao.maps.Roadview) {
      setRoadviewLoaded(true)
      return
    }

    // 로드되지 않았으면 대기
    if (!KAKAO_MAP_API_KEY) {
      setError('Kakao Map API 키가 설정되지 않았습니다.')
      setLoading(false)
      return
    }

    // Script가 이미 로드 중이거나 로드된 경우 빠르게 체크 (50ms 간격)
    const checkInterval = setInterval(() => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.Roadview) {
        clearInterval(checkInterval)
        setRoadviewLoaded(true)
      }
    }, 50)

    // 최대 5초 대기 (1초에서 5초로 증가하되, 체크 간격은 더 빠르게)
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval)
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.Roadview) {
        // Script가 없으면 로드 시도
        const script = document.createElement('script')
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`
        script.async = true
        script.onload = () => {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              // setTimeout 제거하여 즉시 로드
              setRoadviewLoaded(true)
            })
          }
        }
        script.onerror = () => {
          setError('Kakao Map API를 로드할 수 없습니다.')
          setLoading(false)
        }
        document.head.appendChild(script)
      }
    }, 200) // 1초에서 200ms로 단축

    return () => {
      clearInterval(checkInterval)
      clearTimeout(timeoutId)
    }
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
            <span className="material-symbols-outlined text-4xl text-blue-500 dark:text-blue-400 mb-2">streetview</span>
            <p className="text-sm text-blue-600 dark:text-blue-400">{error}</p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full rounded-lg overflow-hidden bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 relative" style={{ width: '100%', height: '100%' }}>
          {/* 로드뷰가 로드되는 동안 로딩 표시 */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-blue-100 dark:bg-blue-900/20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
                <p className="text-sm text-blue-600 dark:text-blue-400">로드뷰를 불러오는 중...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

