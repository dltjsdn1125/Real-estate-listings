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
 * 주소를 좌표로 변환 (주소 검색 실패 시 키워드 검색으로 폴백)
 * @param address 주소 문자열
 * @returns Promise<Coordinates | null>
 */
export async function addressToCoordinates(address: string): Promise<Coordinates | null> {
  // 먼저 주소 검색 시도
  const addressResult = await tryAddressSearch(address)
  if (addressResult) {
    return addressResult
  }

  // 주소 검색 실패 시 키워드 검색 시도
  const keywordResult = await tryKeywordSearch(address)
  return keywordResult
}

/**
 * 주소 검색 (Geocoder.addressSearch)
 */
async function tryAddressSearch(address: string): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
      resolve(null)
      return
    }

    const tryGeocode = () => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        return false
      }

      try {
        const geocoder = new window.kakao.maps.services.Geocoder()
        geocoder.addressSearch(address, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = {
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x),
            }
            resolve(coords)
          } else {
            resolve(null)
          }
        })
        return true
      } catch {
        return false
      }
    }

    if (tryGeocode()) {
      return
    }

    let attempts = 0
    const maxAttempts = 25
    const checkInterval = setInterval(() => {
      attempts++
      if (tryGeocode()) {
        clearInterval(checkInterval)
        return
      }
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        resolve(null)
      }
    }, 200)
  })
}

/**
 * 키워드 검색 (Places.keywordSearch) - 상호명, 건물명, 역명 등
 */
async function tryKeywordSearch(keyword: string): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
      resolve(null)
      return
    }

    const trySearch = () => {
      if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
        return false
      }

      try {
        const places = new window.kakao.maps.services.Places()

        // 대구 지역 중심으로 검색 (대구 시청 좌표)
        const options = {
          location: new window.kakao.maps.LatLng(35.8714, 128.6014),
          radius: 30000, // 30km 반경
          sort: window.kakao.maps.services.SortBy.DISTANCE,
        }

        places.keywordSearch(keyword, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const coords = {
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x),
            }
            if (process.env.NODE_ENV === 'development') {
              console.log('키워드 검색 성공:', keyword, result[0].place_name)
            }
            resolve(coords)
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.error('키워드 검색 실패:', keyword, status)
            }
            resolve(null)
          }
        }, options)
        return true
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Places 검색 오류:', error)
        }
        return false
      }
    }

    if (trySearch()) {
      return
    }

    let attempts = 0
    const maxAttempts = 25
    const checkInterval = setInterval(() => {
      attempts++
      if (trySearch()) {
        clearInterval(checkInterval)
        return
      }
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        resolve(null)
      }
    }, 200)
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
    if (window.kakao && window.kakao.maps) {
      if (window.kakao.maps.services) {
        resolve(true)
        return
      }
      // 지도는 로드되었지만 services가 아직 없는 경우, 최대 5초 대기
      let attempts = 0
      const maxQuickAttempts = 25 // 5초 대기
      const quickCheck = setInterval(() => {
        attempts++
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          clearInterval(quickCheck)
          resolve(true)
          return
        }
        if (attempts >= maxQuickAttempts) {
          clearInterval(quickCheck)
          if (process.env.NODE_ENV === 'development') {
            console.warn('Kakao Maps services 로드 타임아웃 - 지도는 로드되었지만 services가 없습니다')
          }
          // 지도는 로드되었으므로 true 반환 (services는 나중에 사용할 때 체크)
          resolve(true)
          return
        }
      }, 200)
      return
    }

    // 로드 대기 (최대 10초)
    let attempts = 0
    const maxAttempts = 50 // 50 * 200ms = 10초

    const checkInterval = setInterval(() => {
      attempts++

      if (window.kakao && window.kakao.maps) {
        clearInterval(checkInterval)
        // services는 나중에 필요할 때 체크
        resolve(true)
        return
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        // 개발 환경에서만 에러 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.warn('Kakao Maps API 로드 타임아웃')
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

