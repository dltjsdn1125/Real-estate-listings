// Kakao Maps Geocoding API를 사용한 주소 → 좌표 변환

declare global {
  interface Window {
    kakao: any
  }
}

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * 주소를 좌표로 변환
 * @param address 주소 문자열
 * @returns Promise<Coordinates | null>
 */
export async function addressToCoordinates(address: string): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    // Kakao Maps API가 로드되지 않은 경우
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
      console.error('Kakao Maps API가 로드되지 않았습니다.')
      resolve(null)
      return
    }

    const geocoder = new window.kakao.maps.services.Geocoder()

    geocoder.addressSearch(address, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = {
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
        }
        resolve(coords)
      } else {
        console.error('주소 변환 실패:', address, status)
        resolve(null)
      }
    })
  })
}

/**
 * 좌표를 주소로 변환 (역지오코딩)
 * @param lat 위도
 * @param lng 경도
 * @returns Promise<string | null>
 */
export async function coordinatesToAddress(
  lat: number,
  lng: number
): Promise<string | null> {
  return new Promise((resolve) => {
    // Kakao Maps API가 로드되지 않은 경우
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
      console.error('Kakao Maps API가 로드되지 않았습니다.')
      resolve(null)
      return
    }

    const geocoder = new window.kakao.maps.services.Geocoder()
    const coord = new window.kakao.maps.LatLng(lat, lng)

    geocoder.coord2Address(coord.getLng(), coord.getLat(), (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const address = result[0].address.address_name
        resolve(address)
      } else {
        console.error('좌표 변환 실패:', lat, lng, status)
        resolve(null)
      }
    })
  })
}

/**
 * Kakao Maps API 로드 대기
 */
export function waitForKakaoMaps(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve(true)
      return
    }

    // 로드 대기 (최대 10초)
    let attempts = 0
    const maxAttempts = 50 // 50 * 200ms = 10초

    const checkInterval = setInterval(() => {
      attempts++

      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        clearInterval(checkInterval)
        resolve(true)
        return
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        // 개발 환경에서만 에러 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.warn('Kakao Maps API 로드 타임아웃 - 지도가 이미 로드되었을 수 있습니다')
        }
        resolve(false)
      }
    }, 200)
  })
}

/**
 * 주소 검증 및 정규화
 * @param address 주소 문자열
 * @returns 정규화된 주소 또는 null
 */
export function normalizeAddress(address: string): string {
  // 공백 정리
  let normalized = address.trim().replace(/\s+/g, ' ')

  // 대구광역시 자동 추가 (없는 경우)
  if (!normalized.includes('대구') && !normalized.includes('Daegu')) {
    normalized = `대구광역시 ${normalized}`
  }

  return normalized
}

