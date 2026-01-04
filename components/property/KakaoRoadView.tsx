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
  const isMountedRef = useRef<boolean>(true)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 안전한 상태 업데이트 함수
  const safeSetState = (updateFn: () => void) => {
    if (isMountedRef.current) {
      updateFn()
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    
    if (!containerRef.current) {
      isMountedRef.current = false
      return
    }

    let cancelled = false
    let timeoutId: NodeJS.Timeout | null = null

    const initRoadview = () => {
      if (cancelled || !isMountedRef.current || !containerRef.current) return

      const kakao = window.kakao
      if (!kakao?.maps) {
        safeSetState(() => {
          setError('Kakao Maps API를 로드할 수 없습니다.')
          setLoading(false)
        })
        return
      }

      // kakao.maps.load가 필요한 경우
      if (!kakao.maps.Roadview) {
        kakao.maps.load(() => {
          if (!cancelled && isMountedRef.current) {
            initRoadview()
          }
        })
        return
      }

      try {
        // 로드뷰 생성 (한 번만)
        if (!roadviewRef.current && containerRef.current) {
          roadviewRef.current = new kakao.maps.Roadview(containerRef.current)
        }

        // 클라이언트 생성 (한 번만)
        if (!clientRef.current) {
          clientRef.current = new kakao.maps.RoadviewClient()
        }

        if (!roadviewRef.current || !clientRef.current || !isMountedRef.current) {
          return
        }

        const position = new kakao.maps.LatLng(latitude, longitude)

        // 타임아웃 1.5초
        timeoutId = setTimeout(() => {
          if (!cancelled && isMountedRef.current) {
            safeSetState(() => {
              setError('로드뷰 로딩 시간 초과')
              setLoading(false)
            })
          }
        }, 1500)

        // 파노라마 검색
        clientRef.current.getNearestPanoId(position, 200, (panoId: number) => {
          if (cancelled || !isMountedRef.current) {
            if (timeoutId) clearTimeout(timeoutId)
            return
          }
          
          if (timeoutId) clearTimeout(timeoutId)

          if (!roadviewRef.current || !isMountedRef.current) {
            return
          }

          safeSetState(() => {
            if (panoId > 0) {
              try {
                roadviewRef.current.setPanoId(panoId, position)
                setError(null)
              } catch (e) {
                setError('로드뷰 설정 오류')
              }
            } else {
              setError('이 위치의 로드뷰가 없습니다.')
            }
            setLoading(false)
          })
        })
      } catch (e) {
        if (!cancelled && isMountedRef.current) {
          safeSetState(() => {
            setError('로드뷰 초기화 오류')
            setLoading(false)
          })
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
      checkIntervalRef.current = setInterval(() => {
        attempts++
        if (window.kakao?.maps) {
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
          if (!cancelled && isMountedRef.current) {
            if (window.kakao.maps.Roadview) {
              initRoadview()
            } else {
              window.kakao.maps.load(initRoadview)
            }
          }
        } else if (attempts > 200) { // 2초 제한
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
          if (!cancelled && isMountedRef.current) {
            safeSetState(() => {
              setError('API 로드 실패')
              setLoading(false)
            })
          }
        }
      }, 10)
    }

    return () => {
      cancelled = true
      isMountedRef.current = false
      
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }

      // Roadview 인스턴스 정리 (안전하게)
      try {
        // containerRef가 여전히 DOM에 연결되어 있는지 확인
        if (containerRef.current && containerRef.current.parentNode) {
          // Roadview 인스턴스가 있는 경우 안전하게 정리
          if (roadviewRef.current) {
            try {
              // Kakao Maps의 내부 정리 메서드가 있다면 호출
              if (typeof roadviewRef.current.relayout === 'function') {
                roadviewRef.current.relayout()
              }
            } catch (e) {
              // relayout 오류는 무시
            }
            // ref만 null로 설정 (DOM은 React가 정리)
            roadviewRef.current = null
          }
        } else {
          // containerRef가 이미 DOM에서 제거된 경우 ref만 정리
          roadviewRef.current = null
        }
        
        // Client ref 정리
        if (clientRef.current) {
          clientRef.current = null
        }
      } catch (e) {
        // 정리 중 발생한 모든 오류 무시 (React가 이미 DOM을 정리했을 수 있음)
        if (process.env.NODE_ENV === 'development') {
          console.debug('KakaoRoadView cleanup 오류 (무시됨):', e)
        }
      }
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
