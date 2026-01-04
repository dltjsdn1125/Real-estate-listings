'use client'

import { useEffect, useLayoutEffect, useRef, useState, memo } from 'react'

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
  const roadviewContainerRef = useRef<HTMLDivElement>(null)
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
    
    if (!roadviewContainerRef.current) {
      isMountedRef.current = false
      return
    }

    let cancelled = false
    let timeoutId: NodeJS.Timeout | null = null

    const initRoadview = () => {
      if (cancelled || !isMountedRef.current || !roadviewContainerRef.current) return

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
        // 로드뷰 생성 (한 번만) - roadviewContainerRef를 사용
        if (!roadviewRef.current && roadviewContainerRef.current) {
          roadviewRef.current = new kakao.maps.Roadview(roadviewContainerRef.current)
        }

        // 클라이언트 생성 (한 번만)
        if (!clientRef.current) {
          clientRef.current = new kakao.maps.RoadviewClient()
        }

        if (!roadviewRef.current || !clientRef.current || !isMountedRef.current) {
          return
        }

        const position = new kakao.maps.LatLng(latitude, longitude)

        // 타임아웃 5초로 증가
        timeoutId = setTimeout(() => {
          if (!cancelled && isMountedRef.current) {
            safeSetState(() => {
              setError('로드뷰 로딩 시간 초과')
              setLoading(false)
            })
          }
        }, 5000)

        // 파노라마 검색 - 반경을 500m로 증가
        clientRef.current.getNearestPanoId(position, 500, (panoId: number) => {
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
                setLoading(false)
                
                // 로드뷰 로드 이벤트 리스너 추가
                const handleRoadviewLoad = () => {
                  safeSetState(() => {
                    setLoading(false)
                    setError(null)
                  })
                }
                
                kakao.maps.event.addListener(roadviewRef.current, 'init', handleRoadviewLoad)
              } catch (e) {
                console.error('로드뷰 설정 오류:', e)
                setError('로드뷰 설정 오류')
                setLoading(false)
              }
            } else {
              setError('이 위치의 로드뷰가 없습니다.')
              setLoading(false)
            }
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

      // Roadview 인스턴스 정리 (즉시)
      // ref를 먼저 null로 설정하여 이후 DOM 조작을 방지
      const roadview = roadviewRef.current
      const client = clientRef.current
      const roadviewContainer = roadviewContainerRef.current
      
      roadviewRef.current = null
      clientRef.current = null

      // roadviewContainer의 innerHTML을 즉시 비워서 Kakao Maps가 생성한 DOM 노드를 제거
      // 이렇게 하면 React가 나중에 removeChild를 시도할 때 이미 제거된 노드가 되어 오류 방지
      if (roadviewContainer) {
        try {
          // roadviewContainer의 모든 자식 노드를 안전하게 제거
          // innerHTML을 사용하면 Kakao Maps가 생성한 모든 노드가 한 번에 제거됨
          roadviewContainer.innerHTML = ''
        } catch (e) {
          // innerHTML 설정 오류 무시 (이미 제거되었을 수 있음)
        }
      }

      // DOM 정리는 다음 이벤트 루프에서 수행하여 React의 정리와 충돌 방지
      setTimeout(() => {
        try {
          // Roadview 인스턴스가 있었던 경우 안전하게 정리 시도
          if (roadview) {
            try {
              // Kakao Maps API의 정리 메서드 호출 (있는 경우)
              if (typeof roadview.setMap === 'function') {
                roadview.setMap(null)
              }
            } catch (e) {
              // 정리 메서드 호출 오류 무시
            }
          }
          // Client 인스턴스도 정리
          if (client) {
            try {
              // 필요한 경우 client 정리 메서드 호출
            } catch (e) {
              // 정리 오류 무시
            }
          }
        } catch (e) {
          // 모든 정리 오류 무시 (이미 언마운트되었을 수 있음)
        }
      }, 0)
    }
  }, [latitude, longitude])

  // useLayoutEffect로 cleanup을 더 일찍 수행하여 React의 DOM 정리보다 먼저 실행
  useLayoutEffect(() => {
    return () => {
      const roadviewContainer = roadviewContainerRef.current
      if (roadviewContainer) {
        try {
          // React의 DOM 정리 전에 roadviewContainer를 비워서 removeChild 오류 방지
          roadviewContainer.innerHTML = ''
        } catch (e) {
          // 오류 무시
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
      {/* Kakao Maps가 DOM을 직접 조작하는 전용 컨테이너 */}
      {/* React는 이 div 내부를 추적하지 않도록 분리 */}
      <div
        ref={roadviewContainerRef}
        className="absolute inset-0"
        suppressHydrationWarning
      />
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-20">
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
