'use client'

import { useEffect, useRef, useState, memo } from 'react'

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

function KakaoRoadView({
  latitude,
  longitude,
  width = '100%',
  height = '400px',
  className = '',
}: KakaoRoadViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const roadviewRef = useRef<any>(null)
  const clientRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let timeoutId: NodeJS.Timeout

    const initRoadview = () => {
      if (cancelled || !containerRef.current) return

      const kakao = window.kakao
      if (!kakao?.maps) {
        setError('Kakao Maps API를 로드할 수 없습니다.')
        setLoading(false)
        return
      }

      // kakao.maps.load가 필요한 경우
      if (!kakao.maps.Roadview) {
        kakao.maps.load(() => {
          if (!cancelled) initRoadview()
        })
        return
      }

      try {
        // 로드뷰 생성 (한 번만)
        if (!roadviewRef.current) {
          roadviewRef.current = new kakao.maps.Roadview(containerRef.current)
        }

        // 클라이언트 생성 (한 번만)
        if (!clientRef.current) {
          clientRef.current = new kakao.maps.RoadviewClient()
        }

        const position = new kakao.maps.LatLng(latitude, longitude)

        // 타임아웃 1.5초
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            setError('로드뷰 로딩 시간 초과')
            setLoading(false)
          }
        }, 1500)

        // 파노라마 검색
        clientRef.current.getNearestPanoId(position, 200, (panoId: number) => {
          if (cancelled) return
          clearTimeout(timeoutId)

          if (panoId > 0) {
            roadviewRef.current.setPanoId(panoId, position)
            setError(null)
          } else {
            setError('이 위치의 로드뷰가 없습니다.')
          }
          setLoading(false)
        })
      } catch (e) {
        if (!cancelled) {
          setError('로드뷰 초기화 오류')
          setLoading(false)
        }
      }
    }

    // 즉시 시도
    if (window.kakao?.maps?.Roadview) {
      initRoadview()
    } else if (window.kakao?.maps?.load) {
      window.kakao.maps.load(initRoadview)
    } else {
      // API 로드 대기 (10ms 간격)
      let attempts = 0
      const check = setInterval(() => {
        attempts++
        if (window.kakao?.maps) {
          clearInterval(check)
          if (window.kakao.maps.Roadview) {
            initRoadview()
          } else {
            window.kakao.maps.load(initRoadview)
          }
        } else if (attempts > 200) { // 2초 제한
          clearInterval(check)
          setError('API 로드 실패')
          setLoading(false)
        }
      }, 10)

      return () => {
        cancelled = true
        clearInterval(check)
        clearTimeout(timeoutId)
      }
    }

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width, height, minHeight: height }}
    >
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center p-4">
            <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">streetview</span>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">로드뷰 로딩...</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default memo(KakaoRoadView)
