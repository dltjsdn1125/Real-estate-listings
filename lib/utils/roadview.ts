/**
 * 카카오 로드뷰 썸네일 URL 생성
 * 카카오 로드뷰는 직접 썸네일 URL을 제공하지 않으므로,
 * 파노라마 ID를 가져와서 로드뷰가 있는지 확인하고,
 * 있으면 정적 지도 이미지 대신 로드뷰를 표시할 수 있도록 함
 * @param latitude 위도
 * @param longitude 경도
 * @returns 파노라마 ID 또는 null
 */
export async function getRoadviewPanoId(
  latitude: number,
  longitude: number
): Promise<number | null> {
  // 카카오 맵이 로드되지 않았으면 null 반환
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 getRoadviewPanoId - window is undefined')
    }
    return null
  }

  if (!window.kakao || !window.kakao.maps) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 getRoadviewPanoId - Kakao Maps not loaded')
    }
    return null
  }

  // RoadviewClient가 사용 가능한지 확인
  if (!window.kakao.maps.RoadviewClient) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 getRoadviewPanoId - RoadviewClient not available')
    }
    return null
  }

  if (typeof window.kakao.maps.RoadviewClient !== 'function') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 getRoadviewPanoId - RoadviewClient is not a function')
    }
    return null
  }

  try {
    // RoadviewClient 인스턴스 생성 시도
    const roadviewClient = new window.kakao.maps.RoadviewClient()
    
    if (!roadviewClient) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔍 getRoadviewPanoId - Failed to create RoadviewClient instance')
      }
      return null
    }

    if (typeof roadviewClient.getNearestPanoId !== 'function') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔍 getRoadviewPanoId - getNearestPanoId is not a function')
      }
      return null
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 getRoadviewPanoId - Calling getNearestPanoId:', { lat: latitude, lng: longitude })
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔍 getRoadviewPanoId - Timeout after 5 seconds')
        }
        resolve(null)
      }, 5000) // 10초에서 5초로 단축

      try {
        // LatLng 객체 생성 (문서에 따르면 첫 번째 인자는 LatLng 객체여야 함)
        if (!window.kakao.maps.LatLng || typeof window.kakao.maps.LatLng !== 'function') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('🔍 getRoadviewPanoId - LatLng constructor not available')
          }
          clearTimeout(timeoutId)
          resolve(null)
          return
        }

        const position = new window.kakao.maps.LatLng(latitude, longitude)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 getRoadviewPanoId - Calling getNearestPanoId with LatLng:', { lat: latitude, lng: longitude })
        }

        // getNearestPanoId 호출 (문서: roadviewClient.getNearestPanoId(position, 50, function(panoId) {...}))
        // 반경을 50m에서 200m로 확대하여 더 넓은 범위에서 로드뷰 검색
        roadviewClient.getNearestPanoId(
          position, // LatLng 객체
          200, // 반경 200m (50m에서 확대)
          (panoId: number) => {
            clearTimeout(timeoutId)
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 getRoadviewPanoId - Callback received:', { 
                panoId, 
                isValid: panoId && panoId > 0,
                lat: latitude,
                lng: longitude
              })
            }
            // panoId가 0보다 크면 유효한 로드뷰
            if (panoId && panoId > 0) {
              resolve(panoId)
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ getRoadviewPanoId - 로드뷰가 없는 위치:', { lat: latitude, lng: longitude, panoId })
              }
              resolve(null)
            }
          }
        )
      } catch (error: any) {
        clearTimeout(timeoutId)
        // Kakao API 내부 오류는 조용히 처리 (로드뷰 없음으로 처리)
        // 개발 환경에서만 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔍 getRoadviewPanoId - Error calling getNearestPanoId (silently handled):', error?.message || error)
        }
        resolve(null)
      }
    })
  } catch (error: any) {
    // 오류 발생 시 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 getRoadviewPanoId - General error:', error?.message || error)
    }
    return null
  }
}

/**
 * 카카오 정적 지도 이미지 URL 생성 (클라이언트 사이드)
 * 클라이언트에서 직접 사용할 수 있는 정적 지도 이미지 URL 생성
 * 참고: Kakao Static Map API는 서버 사이드에서만 사용 가능하며,
 * 클라이언트에서는 다른 방법을 사용해야 합니다.
 * @param latitude 위도
 * @param longitude 경도
 * @param width 이미지 너비 (기본값: 640)
 * @param height 이미지 높이 (기본값: 360)
 * @param level 지도 레벨 (기본값: 3)
 * @returns 정적 지도 이미지 URL (서버 API route 사용)
 */
export function getStaticMapUrl(
  latitude: number,
  longitude: number,
  width: number = 640,
  height: number = 360,
  level: number = 3
): string {
  // 서버 사이드 API route 사용
  return `/api/static-map?lat=${latitude}&lng=${longitude}&width=${width}&height=${height}&level=${level}&roadview=false`
}

