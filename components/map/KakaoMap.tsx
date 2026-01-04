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
  onMapClick?: (lat: number, lng: number) => void
  onBoundsChange?: (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void
  center?: { lat: number; lng: number }
  level?: number // 지도 확대/축소 레벨 (1-14, 높을수록 확대)
  pinItMode?: boolean // Pin it 모드 활성화 여부
  onPinItClick?: () => void // Pin it 버튼 클릭 핸들러
  showPinItButton?: boolean // Pin it 버튼 표시 여부
  selectedLocation?: { lat: number; lng: number; address?: string } | null // 선택된 위치 (위치 보기에서 사용)
}

export default function KakaoMap({
  properties = [],
  onMapReady,
  onMarkerClick,
  onMapClick,
  onBoundsChange,
  center,
  level = 3, // 기본 레벨 (대구 전체 보기)
  pinItMode = false,
  onPinItClick,
  showPinItButton = false,
  selectedLocation = null, // 선택된 위치
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null) // map 인스턴스를 ref로도 저장하여 항상 최신 값 참조
  const [map, setMap] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [markers, setMarkers] = useState<any[]>([])
  const [clusterer, setClusterer] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [userMarker, setUserMarker] = useState<any>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [pinItMarker, setPinItMarker] = useState<any>(null) // Pin it 모드 마커
  const [selectedLocationMarker, setSelectedLocationMarker] = useState<any>(null) // 선택된 위치 마커
  const pendingCenterRef = useRef<{ lat: number; lng: number } | undefined>(undefined) // 지도가 준비되기 전에 설정된 center 저장
  
  // BFCache 정리를 위해 최신 상태를 ref로 저장
  const markersRef = useRef<any[]>([])
  const clustererRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const pinItMarkerRef = useRef<any>(null)
  const selectedLocationMarkerRef = useRef<any>(null)
  
  // 상태와 ref 동기화
  useEffect(() => {
    markersRef.current = markers
  }, [markers])
  
  useEffect(() => {
    clustererRef.current = clusterer
  }, [clusterer])
  
  useEffect(() => {
    userMarkerRef.current = userMarker
  }, [userMarker])
  
  useEffect(() => {
    pinItMarkerRef.current = pinItMarker
  }, [pinItMarker])
  
  useEffect(() => {
    selectedLocationMarkerRef.current = selectedLocationMarker
  }, [selectedLocationMarker])

  // pinItMode를 ref로 저장하여 이벤트 핸들러에서 최신 값 참조
  const pinItModeRef = useRef(pinItMode)
  useEffect(() => {
    pinItModeRef.current = pinItMode
  }, [pinItMode])

  // onMapClick을 ref로 저장하여 이벤트 핸들러에서 최신 콜백 참조
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  // onBoundsChange를 ref로 저장하여 이벤트 핸들러에서 최신 콜백 참조
  const onBoundsChangeRef = useRef(onBoundsChange)
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange
  }, [onBoundsChange])

  // 모바일 감지 (SSR 안전)
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  // 사용자 위치 마커 업데이트 함수
  const updateUserMarker = useCallback((location: { lat: number; lng: number }) => {
    if (!map || !window.kakao) return

    // 기존 마커 제거
    // Kakao Maps API 클래스 확인
    if (!window.kakao?.maps?.LatLng || !window.kakao?.maps?.Marker || !window.kakao?.maps?.MarkerImage || !window.kakao?.maps?.Size || !window.kakao?.maps?.Point) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - API 클래스가 아직 로드되지 않음 (updateUserMarker)')
      }
      return
    }

    setUserMarker((prevMarker: any) => {
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

  // 지도 초기화 함수 (재사용 가능하도록 분리)
  const initializeMap = useCallback(() => {
    // 조건 확인
    if (!window.kakao || !window.kakao.maps) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - API가 아직 로드되지 않음')
      }
      return false
    }

    // Kakao Maps API가 완전히 로드되었는지 확인 (LatLng, Map 등 필수 클래스 확인)
    if (!window.kakao.maps.LatLng || !window.kakao.maps.Map) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - API 클래스가 아직 로드되지 않음 (LatLng, Map 확인)')
      }
      return false
    }

    // 이미 지도가 있으면 스킵
    if (mapInstanceRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - 이미 지도 인스턴스가 존재함')
      }
      return false
    }

    // mapRef가 없으면 스킵
    if (!mapRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - mapRef가 없음')
      }
      return false
    }

    try {
      // mapRef의 innerHTML을 완전히 정리 (BFCache 복원 시 이전 DOM 제거)
      if (mapRef.current.innerHTML) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 KakaoMap - mapRef DOM 정리 중...')
        }
        mapRef.current.innerHTML = ''
      }

      // 중심 좌표 결정
      const defaultCenter = pendingCenterRef.current || center || userLocation || { lat: 35.8714, lng: 128.6014 }

      // 고해상도 지도 옵션 (LatLng가 로드되었는지 다시 확인)
      if (!window.kakao.maps.LatLng) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ KakaoMap - LatLng 클래스를 사용할 수 없음')
        }
        return false
      }

      const mapOption = {
        center: new window.kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
        level: level,
      }

      // 지도 생성
      const kakaoMap = new window.kakao.maps.Map(mapRef.current, mapOption)
      mapInstanceRef.current = kakaoMap
      setMap(kakaoMap)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ KakaoMap - 지도 초기화 완료')
      }
      
      // 마커 클러스터러 생성
      if (window.kakao.maps.MarkerClusterer) {
        try {
          const markerClusterer = new window.kakao.maps.MarkerClusterer({
            map: kakaoMap,
            averageCenter: true,
            minLevel: 5,
            disableClickZoom: false,
            styles: [
              {
                width: '40px',
                height: '40px',
                background: 'rgba(255, 0, 0, 0.6)',
                borderRadius: '20px',
                color: '#fff',
                textAlign: 'center',
                fontWeight: 'bold',
                lineHeight: '40px',
              },
            ],
          })
          setClusterer(markerClusterer)
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('MarkerClusterer 생성 실패:', error)
          }
          setClusterer(null)
        }
      } else {
        setClusterer(null)
      }

      // 지도 클릭 이벤트 추가
      window.kakao.maps.event.addListener(kakaoMap, 'click', (mouseEvent: any) => {
        const latlng = mouseEvent.latLng
        const lat = latlng.getLat()
        const lng = latlng.getLng()

        if (pinItModeRef.current && kakaoMap) {
          // Kakao Maps API 클래스 확인
          if (!window.kakao?.maps?.Marker || !window.kakao?.maps?.MarkerImage || !window.kakao?.maps?.Size || !window.kakao?.maps?.Point) {
            if (process.env.NODE_ENV === 'development') {
              console.log('⚠️ KakaoMap - API 클래스가 아직 로드되지 않음 (Pin it 마커)')
            }
            return
          }

          setPinItMarker((prevMarker: any) => {
            if (prevMarker) {
              prevMarker.setMap(null)
            }
            return null
          })

          const marker = new window.kakao.maps.Marker({
            position: latlng,
            map: kakaoMap,
            image: new window.kakao.maps.MarkerImage(
              'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
              new window.kakao.maps.Size(64, 69),
              { offset: new window.kakao.maps.Point(32, 69) }
            ),
            zIndex: 2000,
          })
          setPinItMarker(marker)
        }

        onMapClickRef.current?.(lat, lng)
      })

      // 지도 준비 완료 콜백
      onMapReady?.(kakaoMap)

      // 지도 영역 변경 시 bounds 전달
      window.kakao.maps.event.addListener(kakaoMap, 'idle', () => {
        if (onBoundsChangeRef.current) {
          const bounds = kakaoMap.getBounds()
          const sw = bounds.getSouthWest()
          const ne = bounds.getNorthEast()
          onBoundsChangeRef.current({
            sw: { lat: sw.getLat(), lng: sw.getLng() },
            ne: { lat: ne.getLat(), lng: ne.getLng() },
          })
        }
      })

      return true
    } catch (error) {
      console.error('❌ 지도 초기화 오류:', error)
      return false
    }
  }, [center, level, userLocation, onMapReady])

  // BFCache 복원 감지 및 지도 재초기화
  useEffect(() => {
    const forceReinit = () => {
      // 지도가 없으면 강제로 재초기화
      if (!mapInstanceRef.current && window.kakao && window.kakao.maps) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 KakaoMap - 지도가 없음, 강제 재초기화 시도')
        }
        
        // mapLoaded 상태를 false로 설정한 다음 true로 설정하여 초기화 useEffect가 트리거되도록 함
        setMapLoaded(false)
        
        // 재시도 로직 (mapRef가 준비될 때까지 대기)
        let retryCount = 0
        const maxRetries = 20
        const retryInterval = 200
        
        const attemptInit = () => {
          // mapRef가 준비되었는지 확인
          if (!mapRef.current) {
            if (retryCount < maxRetries) {
              retryCount++
              if (process.env.NODE_ENV === 'development') {
                console.log(`🔄 KakaoMap - mapRef 대기 중 ${retryCount}/${maxRetries}`)
              }
              setTimeout(attemptInit, retryInterval)
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.error('❌ KakaoMap - mapRef 준비 실패, mapLoaded를 true로 설정하여 재시도')
              }
              // mapRef가 없어도 mapLoaded를 true로 설정하여 초기화 useEffect가 트리거되도록 함
              setMapLoaded(true)
            }
            return
          }
          
          // mapRef가 준비되었으면 mapLoaded를 true로 설정하여 초기화 useEffect 트리거
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ KakaoMap - mapRef 준비 완료, mapLoaded를 true로 설정')
          }
          setMapLoaded(true)
        }
        
        setTimeout(attemptInit, 100)
      } else if (!window.kakao || !window.kakao.maps) {
        // API가 아직 로드되지 않았으면 false로 설정하여 Script의 onLoad가 처리하도록
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ KakaoMap - API가 아직 로드되지 않음')
        }
        setMapLoaded(false)
      }
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      // 항상 로그 출력 (pageshow 이벤트 감지 확인)
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 KakaoMap - pageshow 이벤트 감지 (persisted:', event.persisted, ', mapInstanceRef:', !!mapInstanceRef.current, ', mapRef:', !!mapRef.current, ')')
      }
      
      // BFCache에서 복원된 경우 또는 일반 페이지 표시 시 지도 상태 확인
      if (event.persisted || true) { // 항상 확인하도록 변경
        // 기존 지도 인스턴스 정리 (ref를 사용하여 최신 값 참조)
        if (mapInstanceRef.current) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 KakaoMap - 기존 지도 인스턴스 정리 중...')
          }
          try {
            // 모든 마커 제거 (ref로 최신 값 참조)
            const currentMarkers = markersRef.current
            if (currentMarkers.length > 0) {
              currentMarkers.forEach((marker) => {
                try {
                  marker.setMap(null)
                } catch (e) {
                  // 무시
                }
              })
            }
            // 클러스터러 제거 (ref로 최신 값 참조)
            const currentClusterer = clustererRef.current
            if (currentClusterer) {
              try {
                currentClusterer.clear()
              } catch (e) {
                // 무시
              }
            }
            // 사용자 마커 제거 (ref로 최신 값 참조)
            const currentUserMarker = userMarkerRef.current
            if (currentUserMarker) {
              try {
                currentUserMarker.setMap(null)
              } catch (e) {
                // 무시
              }
            }
            // Pin it 마커 제거 (ref로 최신 값 참조)
            const currentPinItMarker = pinItMarkerRef.current
            if (currentPinItMarker) {
              try {
                currentPinItMarker.setMap(null)
              } catch (e) {
                // 무시
              }
            }
            // 선택된 위치 마커 제거 (ref로 최신 값 참조)
            const currentSelectedLocationMarker = selectedLocationMarkerRef.current
            if (currentSelectedLocationMarker) {
              try {
                currentSelectedLocationMarker.setMap(null)
              } catch (e) {
                // 무시
              }
            }
            // 지도 인스턴스 제거
            try {
              if (mapRef.current) {
                mapRef.current.innerHTML = ''
              }
            } catch (e) {
              // 무시
            }
          } catch (e) {
            // 정리 오류 무시
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ KakaoMap - 지도 인스턴스 정리 중 오류:', e)
            }
          }
        }
        
        // 모든 상태 및 ref 리셋
        mapInstanceRef.current = null
        setMap(null)
        setMarkers([])
        setClusterer(null)
        setSelectedLocationMarker(null)
        setPinItMarker(null)
        setUserMarker(null)
        pendingCenterRef.current = undefined // pendingCenter도 초기화
        
        // ref들도 초기화
        markersRef.current = []
        clustererRef.current = null
        userMarkerRef.current = null
        pinItMarkerRef.current = null
        selectedLocationMarkerRef.current = null
        
        // mapRef의 innerHTML을 완전히 정리 (BFCache 복원 시 이전 DOM 제거)
        if (mapRef.current && mapRef.current.innerHTML) {
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 KakaoMap - pageshow 시 mapRef DOM 추가 정리')
            }
            mapRef.current.innerHTML = ''
          } catch (e) {
            // 정리 오류 무시
          }
        }
        
        // mapLoaded를 false로 설정
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 KakaoMap - mapLoaded를 false로 설정')
        }
        setMapLoaded(false)
        
        // DOM이 안정화될 시간을 주고 강제 재초기화 시도
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 KakaoMap - pageshow 후 재초기화 시작 (mapRef:', !!mapRef.current, ', window.kakao:', !!window.kakao, ')')
          }
          
          // mapRef가 준비될 때까지 대기
          let retryCount = 0
          const maxRetries = 50
          const retryInterval = 100
          
          const checkAndReinit = () => {
            if (!mapRef.current) {
              if (retryCount < maxRetries) {
                retryCount++
                if (process.env.NODE_ENV === 'development' && retryCount % 5 === 0) {
                  console.log(`🔄 KakaoMap - pageshow 후 mapRef 대기 중 ${retryCount}/${maxRetries}`)
                }
                setTimeout(checkAndReinit, retryInterval)
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.error('❌ KakaoMap - mapRef 대기 한도 초과, mapLoaded를 true로 설정하여 재시도')
                }
                // mapRef가 없어도 mapLoaded를 true로 설정하여 초기화 useEffect가 트리거되도록 함
                setMapLoaded(true)
              }
              return
            }
            
            // mapRef가 준비되었으면 initializeMap을 직접 호출
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ KakaoMap - pageshow 후 mapRef 준비 완료, initializeMap 직접 호출')
            }
            // mapLoaded를 true로 설정하고 initializeMap을 직접 호출
            setMapLoaded(true)
            // 약간의 지연 후 initializeMap 호출 (상태 업데이트 완료 대기)
            setTimeout(() => {
              if (mapRef.current && !mapInstanceRef.current) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔄 KakaoMap - pageshow 후 initializeMap 호출 시도')
                }
                const result = initializeMap()
                if (result) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('✅ KakaoMap - pageshow 후 initializeMap 성공')
                  }
                } else {
                  if (process.env.NODE_ENV === 'development') {
                    console.error('❌ KakaoMap - pageshow 후 initializeMap 실패, 재시도...')
                  }
                  // 재시도
                  setTimeout(() => {
                    if (mapRef.current && !mapInstanceRef.current) {
                      initializeMap()
                    }
                  }, 200)
                }
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ KakaoMap - pageshow 후 initializeMap 호출 스킵 (mapRef:', !!mapRef.current, ', mapInstanceRef:', !!mapInstanceRef.current, ')')
                }
              }
            }, 100)
          }
          
          checkAndReinit()
        }, 200)
      }
    }

    // focus 이벤트도 감지하여 지도가 없을 때 재초기화
    const handleFocus = () => {
      // 약간의 지연 후 지도 상태 확인 (페이지 전환 후 DOM이 안정화될 시간을 줌)
      setTimeout(() => {
        forceReinit()
      }, 300)
    }

    // pageshow 이벤트 리스너 등록 (캡처 단계에서도 감지하도록 { capture: true } 추가)
    window.addEventListener('pageshow', handlePageShow, { capture: true })
    window.addEventListener('focus', handleFocus)
    
    // visibilitychange 이벤트도 감지 (페이지가 보일 때)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          if (!mapInstanceRef.current && mapRef.current && window.kakao && window.kakao.maps) {
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 KakaoMap - visibilitychange 이벤트로 지도 재초기화 시도')
            }
            forceReinit()
          }
        }, 300)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow, { capture: true })
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [initializeMap]) // initializeMap을 의존성 배열에 추가

  // 컴포넌트 마운트 시 지도 상태 확인 및 초기화
  useEffect(() => {
    // 컴포넌트가 마운트될 때 지도 상태 확인
    const checkMapStatus = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 KakaoMap - 컴포넌트 마운트 시 지도 상태 확인 (mapInstanceRef:', !!mapInstanceRef.current, ', mapRef:', !!mapRef.current, ', mapLoaded:', mapLoaded, ')')
      }
      
      // mapInstanceRef가 없고 mapRef가 있으면 강제 초기화 시도
      if (!mapInstanceRef.current && mapRef.current && window.kakao && window.kakao.maps) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 KakaoMap - 지도 인스턴스가 없고 mapRef가 있으므로 초기화 시도')
        }
        // mapRef의 innerHTML을 정리한 후 초기화
        if (mapRef.current.innerHTML) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 KakaoMap - 마운트 시 mapRef DOM 정리')
          }
          mapRef.current.innerHTML = ''
        }
        // mapLoaded를 true로 설정하여 초기화 useEffect가 트리거되도록 함
        setMapLoaded(true)
        // 약간의 지연 후 initializeMap 직접 호출
        setTimeout(() => {
          if (mapRef.current && !mapInstanceRef.current) {
            initializeMap()
          }
        }, 100)
      } else if (!mapInstanceRef.current && mapRef.current && (!window.kakao || !window.kakao.maps)) {
        // API가 아직 로드되지 않았으면 mapLoaded를 false로 설정하여 Script의 onLoad가 처리하도록
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ KakaoMap - API가 아직 로드되지 않음, mapLoaded를 false로 설정')
        }
        setMapLoaded(false)
      }
    }
    
    // 초기 확인
    checkMapStatus()
    
    // 약간의 지연 후 다시 확인 (DOM이 완전히 렌더링된 후)
    const timeoutId = setTimeout(checkMapStatus, 500)
    
    // 추가 확인 (1초 후) - BFCache 복원 시나리오 대응
    const timeoutId2 = setTimeout(checkMapStatus, 1000)
    
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
    }
  }, [initializeMap]) // initializeMap을 의존성 배열에 추가

  // 지도 초기화 (mapLoaded 변경 시)
  useEffect(() => {
    // 필요한 조건이 충족되지 않으면 리턴
    if (!mapLoaded || !window.kakao || !window.kakao.maps) {
      return
    }

    // mapInstanceRef가 이미 있으면 스킵
    if (mapInstanceRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - 이미 지도 인스턴스가 존재함, 초기화 스킵')
      }
      return
    }

    // mapRef가 준비될 때까지 대기 및 재시도
    if (mapRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 KakaoMap - mapLoaded가 true이고 mapRef가 준비되었으므로 initializeMap 호출')
      }
      initializeMap()
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 KakaoMap - mapLoaded가 true이지만 mapRef가 없음, 재시도 시작')
      }
      // mapRef가 없을 때 여러 번 재시도
      let retryCount = 0
      const maxRetries = 30
      const retryInterval = 100
      
      const retryTimer = setInterval(() => {
        retryCount++
        if (mapRef.current) {
          clearInterval(retryTimer)
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ KakaoMap - mapRef 준비 완료, initializeMap 호출')
          }
          initializeMap()
        } else if (retryCount >= maxRetries) {
          clearInterval(retryTimer)
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ KakaoMap - mapRef 재시도 한도 초과')
          }
        } else if (retryCount % 5 === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 KakaoMap - mapRef 재시도 중 ${retryCount}/${maxRetries}`)
          }
        }
      }, retryInterval)
      
      return () => clearInterval(retryTimer)
    }
  }, [mapLoaded, initializeMap])

  // 지도가 준비되면 사용자 위치 마커 표시
  useEffect(() => {
    if (map && userLocation && !locationError) {
      updateUserMarker(userLocation)
      // 사용자가 위치를 요청한 경우 지도 이동
      if (watchId !== null || userLocation.lat !== 35.8714 || userLocation.lng !== 128.6014) {
        // Kakao Maps API 클래스 확인
        if (window.kakao?.maps?.LatLng) {
          try {
            const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
            map.setCenter(moveLatLon)
            map.setLevel(3) // 확대 레벨 (3 = 상세 지도)
          } catch (error) {
            console.error('❌ KakaoMap - 사용자 위치로 지도 이동 오류:', error)
          }
        }
      }
    }
  }, [map, userLocation, locationError, updateUserMarker, watchId])

  // 컴포넌트 언마운트 시 watchPosition 정리
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  // center가 변경되면 pendingCenterRef에 저장 (map이 준비되기 전에도 저장)
  useEffect(() => {
    if (center) {
      pendingCenterRef.current = center
    }
  }, [center])

  // map이 설정된 직후 pendingCenterRef 확인하여 이동
  useEffect(() => {
    const currentMap = mapInstanceRef.current || map
    
    if (!currentMap || !window.kakao || !pendingCenterRef.current) {
      return
    }
    
    // map이 준비되었고 pendingCenterRef가 있으면 이동
    const centerToMove = pendingCenterRef.current
    if (centerToMove) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📍 KakaoMap - map 준비 후 pendingCenter로 이동:', centerToMove, 'level:', level)
      }
      // Kakao Maps API 클래스 확인
      if (!window.kakao?.maps?.LatLng) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ KakaoMap - LatLng 클래스가 아직 로드되지 않음 (pendingCenter 이동)')
        }
        return
      }
      try {
        const moveLatLon = new window.kakao.maps.LatLng(centerToMove.lat, centerToMove.lng)
        currentMap.panTo(moveLatLon) // 부드럽게 이동
        
        // level도 함께 적용
        if (level !== undefined) {
          currentMap.setLevel(level)
        }
        
        // 이동 완료 후 초기화하지 않음 (center prop과 동기화 유지)
      } catch (error) {
        console.error('❌ KakaoMap - map 준비 후 이동 오류:', error)
      }
    }
  }, [map, level]) // map이 설정될 때만 실행

  // center 또는 level이 변경되면 지도 이동 (외부에서 제어)
  useEffect(() => {
    // mapInstanceRef를 우선 사용하여 항상 최신 map 인스턴스 참조
    // map state가 null이어도 mapInstanceRef에 있으면 사용
    const currentMap = mapInstanceRef.current || map
    
    if (!currentMap || !window.kakao || !window.kakao.maps) {
      // map이 아직 준비되지 않았지만 center가 있으면 저장해두고 나중에 이동
      if (center) {
        pendingCenterRef.current = center
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ KakaoMap - 지도가 아직 준비되지 않았습니다. center 저장:', center, 'mapInstanceRef:', !!mapInstanceRef.current, 'map state:', !!map)
        }
      }
      return
    }
    
    // center가 정의되어 있을 때만 지도 이동
    if (center) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📍 KakaoMap - center prop 변경으로 지도 이동:', center, 'level:', level, 'mapInstanceRef 사용:', !!mapInstanceRef.current, 'map state:', !!map)
      }
      // Kakao Maps API 클래스 확인
      if (!window.kakao?.maps?.LatLng) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ KakaoMap - LatLng 클래스가 아직 로드되지 않음 (center 이동)')
        }
        return
      }
      try {
        const moveLatLon = new window.kakao.maps.LatLng(center.lat, center.lng)
        currentMap.panTo(moveLatLon) // 부드럽게 이동
        pendingCenterRef.current = center // 동기화 유지
      } catch (error) {
        console.error('❌ KakaoMap - 지도 이동 오류:', error)
      }
    }
    
    // level이 정의되어 있을 때만 확대 레벨 변경
    if (level !== undefined && currentMap.getLevel && level !== currentMap.getLevel()) {
      try {
        currentMap.setLevel(level) // 확대 레벨 변경
      } catch (error) {
        console.error('❌ KakaoMap - 레벨 변경 오류:', error)
      }
    }
  }, [map, center, level])

  // 매물 마커 표시 (클러스터링 적용)
  useEffect(() => {
    if (!map || !window.kakao || !clusterer || properties.length === 0) return

    // 기존 마커 제거
    clusterer.clear()
    const newMarkers: any[] = []

    // Kakao Maps API 클래스 확인
    if (!window.kakao?.maps?.LatLng || !window.kakao?.maps?.Marker || !window.kakao?.maps?.InfoWindow || !window.kakao?.maps?.event) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - API 클래스가 아직 로드되지 않음 (매물 마커)')
      }
      return
    }

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

    // 클러스터러에 마커 추가 (클러스터러가 있는 경우에만)
    if (clusterer && clusterer.addMarkers) {
      try {
        clusterer.addMarkers(newMarkers)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('클러스터러에 마커 추가 실패:', error)
        }
      }
    }
    setMarkers(newMarkers)

    // 모든 마커가 보이도록 지도 범위 조정
    if (properties.length > 0 && !center) {
      // Kakao Maps API 클래스 확인
      if (window.kakao?.maps?.LatLngBounds && window.kakao?.maps?.LatLng) {
        try {
          const bounds = new window.kakao.maps.LatLngBounds()
          properties.forEach((property) => {
            bounds.extend(new window.kakao.maps.LatLng(property.lat, property.lng))
          })
          map.setBounds(bounds)
        } catch (error) {
          console.error('❌ KakaoMap - 지도 범위 조정 오류:', error)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, clusterer, properties, onMarkerClick, center])

  // Pin it 모드 변경 시 마커 제거
  useEffect(() => {
    if (!pinItMode && pinItMarker) {
      pinItMarker.setMap(null)
      setPinItMarker(null)
    }
  }, [pinItMode, pinItMarker])

  // 선택된 위치 마커 표시
  useEffect(() => {
    const currentMap = mapInstanceRef.current || map
    
    if (!currentMap || !window.kakao || !window.kakao.maps) {
      return
    }

    // Kakao Maps API 클래스 확인
    if (!window.kakao.maps.LatLng || !window.kakao.maps.Marker || !window.kakao.maps.MarkerImage || !window.kakao.maps.Size || !window.kakao.maps.Point) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ KakaoMap - API 클래스가 아직 로드되지 않음 (selectedLocation 마커)')
      }
      return
    }

    // 기존 선택 위치 마커 제거 (ref로 최신 값 참조)
    const currentSelectedLocationMarker = selectedLocationMarkerRef.current
    if (currentSelectedLocationMarker) {
      currentSelectedLocationMarker.setMap(null)
      selectedLocationMarkerRef.current = null
      setSelectedLocationMarker(null)
    }

    // 새로운 선택 위치 마커 추가
    if (selectedLocation) {
      try {
        // 빨간색 마커 이미지 생성
        const markerImageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
        const markerImageSize = new window.kakao.maps.Size(64, 69)
        const markerImageOptions = {
          offset: new window.kakao.maps.Point(32, 69), // 마커 중심점
        }
        const markerImage = new window.kakao.maps.MarkerImage(
          markerImageSrc,
          markerImageSize,
          markerImageOptions
        )

        // 선택된 위치에 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(selectedLocation.lat, selectedLocation.lng),
          image: markerImage,
          zIndex: 1000, // 다른 마커보다 위에 표시
        })

        marker.setMap(currentMap)
        selectedLocationMarkerRef.current = marker
        setSelectedLocationMarker(marker)

        if (process.env.NODE_ENV === 'development') {
          console.log('📍 선택된 위치 마커 표시:', selectedLocation)
        }
      } catch (error) {
        console.error('❌ 선택된 위치 마커 생성 오류:', error)
      }
    }
    // selectedLocationMarker를 의존성 배열에서 제거하여 무한 루프 방지
    // 의존성 배열 크기를 고정하기 위해 항상 동일한 요소 포함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedLocation?.lat, selectedLocation?.lng])

  // GPS 위치로 지도 이동 (사용자 제스처로 GPS 요청)
  const moveToUserLocation = useCallback(() => {
    // 사용자 제스처로 GPS 요청
    requestLocation()
    
    // 위치가 있으면 지도 이동 (약간의 지연 후)
    if (map && userLocation) {
      setTimeout(() => {
        if (userLocation && map && window.kakao?.maps?.LatLng) {
          try {
            const moveLatLon = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng)
            map.setCenter(moveLatLon)
            map.setLevel(3) // 확대 레벨 (3 = 상세 지도)
          } catch (error) {
            console.error('❌ KakaoMap - 사용자 위치로 지도 이동 오류:', error)
          }
        }
      }, 500)
    }
  }, [map, userLocation, requestLocation])

  return (
    <>
      {KAKAO_MAP_API_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=clusterer,services&autoload=false`}
          strategy="afterInteractive"
          onLoad={() => {
            if (window.kakao && window.kakao.maps) {
              window.kakao.maps.load(() => {
                // services가 로드되었는지 확인
                if (process.env.NODE_ENV === 'development') {
                  console.log('Kakao Maps 로드 완료:', {
                    hasMaps: !!window.kakao.maps,
                    hasServices: !!window.kakao.maps.services,
                    hasClusterer: !!window.kakao.maps.MarkerClusterer,
                  })
                }
                // 약간의 지연 후 mapLoaded 설정 (DOM이 준비될 때까지)
                setTimeout(() => {
                  setMapLoaded(true)
                }, 100)
              })
            } else {
              console.error('Kakao Maps API가 제대로 로드되지 않았습니다.')
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
        <div 
          ref={mapRef} 
          className="w-full h-full absolute inset-0" 
          style={{ minHeight: '400px' }}
        />
        
        {/* 위치 오류 메시지 */}
        {locationError && (
          <div className="absolute top-4 left-4 z-10 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-lg text-sm">
            {locationError}
          </div>
        )}

        {/* 모바일 하단 컨트롤 바 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden z-20 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1.5">
          {/* Pin it 버튼 */}
          {showPinItButton && (
            <button
              onClick={onPinItClick}
              className={`size-10 rounded-full flex items-center justify-center transition-colors ${
                pinItMode
                  ? 'bg-primary text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={pinItMode ? "Pin it 모드 해제" : "Pin it 모드"}
            >
              <span className="material-symbols-outlined text-xl">push_pin</span>
            </button>
          )}
          {/* GPS 위치 이동 버튼 */}
          <button
            onClick={moveToUserLocation}
            className="size-10 rounded-full flex items-center justify-center text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={userLocation ? "내 위치로 이동" : "내 위치 찾기"}
          >
            <span className="material-symbols-outlined text-xl">my_location</span>
          </button>
          {/* 구분선 */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          {/* 확대 버튼 */}
          <button
            onClick={() => map?.setLevel(Math.max(1, (map.getLevel() || 3) - 1))}
            className="size-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="확대"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          {/* 축소 버튼 */}
          <button
            onClick={() => map?.setLevel(Math.min(14, (map.getLevel() || 3) + 1))}
            className="size-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="축소"
          >
            <span className="material-symbols-outlined text-xl">remove</span>
          </button>
        </div>

        {/* 데스크톱 전용 컨트롤 */}
        <div className="hidden md:flex absolute right-4 bottom-8 flex-col gap-2 z-10">
          {/* Pin it 버튼 - 데스크톱 */}
          {showPinItButton && (
            <button
              onClick={onPinItClick}
              className={`size-12 rounded-lg shadow-lg flex items-center justify-center transition-colors ${
                pinItMode
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={pinItMode ? "Pin it 모드 해제" : "Pin it 모드"}
            >
              <span className="material-symbols-outlined text-2xl">push_pin</span>
            </button>
          )}
          {/* GPS 위치 이동 버튼 */}
          <button
            onClick={moveToUserLocation}
            className="size-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={userLocation ? "내 위치로 이동" : "내 위치 찾기"}
          >
            <span className="material-symbols-outlined text-2xl">my_location</span>
          </button>
          {/* 확대 버튼 */}
          <button
            onClick={() => map?.setLevel(Math.max(1, (map.getLevel() || 3) - 1))}
            className="size-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="확대"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </button>
          {/* 축소 버튼 */}
          <button
            onClick={() => map?.setLevel(Math.min(14, (map.getLevel() || 3) + 1))}
            className="size-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            title="축소"
          >
            <span className="material-symbols-outlined text-2xl">remove</span>
          </button>
        </div>
      </div>
    </>
  )
}

