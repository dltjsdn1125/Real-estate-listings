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
 * 제목에서 상호명 추출 (예: "이곡동 홈플러스 상가 1층 42평" -> "홈플러스")
 * @param title 매물 제목
 * @returns 상호명 또는 null
 */
export function extractBusinessName(title: string): string | null {
  if (!title) return null

  // 1. 직접 키워드 매칭 (우선순위 높음)
  // "이곡동 홈플러스 상가 1층 42평"에서 "홈플러스" 직접 찾기
  const directKeywords = [
    '홈플러스', '이마트', '롯데마트', '백화점', '대형마트', 
    '편의점', '스타벅스', '맥도날드', '버거킹', 'KFC',
    '올리브영', 'GS25', 'CU', '세븐일레븐', '이니스프리',
    '롯데백화점', '신세계백화점', '현대백화점', '갤러리아백화점'
  ]
  
  for (const keyword of directKeywords) {
    if (title.includes(keyword)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 직접 키워드 매칭:', { 원본제목: title, 키워드: keyword })
      }
      return keyword
    }
  }

  // 2. 패턴 기반 추출
  // "동명 상호명 상가/매물" 형식에서 상호명 추출
  const patterns = [
    // "이곡동 홈플러스 상가 1층 42평" -> "홈플러스"
    /([가-힣]+동)\s+([가-힣A-Za-z0-9\s]+?)\s+(상가|매물|건물|사무실|카페|음식점|식당|마트|백화점|편의점|약국|병원|은행|학교|학원)/,
    // "이곡동 홈플러스 상가 1층" -> "홈플러스"
    /([가-힣]+동)\s+([가-힣A-Za-z0-9\s]+?)\s+(\d+층)/,
    // "홈플러스 상가" -> "홈플러스"
    /([가-힣A-Za-z0-9\s]+?)\s+(상가|매물|건물|사무실|카페|음식점|식당|마트|백화점|편의점|약국|병원|은행|학교|학원)/,
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match && match[2]) {
      // 상호명 추출 (공백 제거)
      let businessName = match[2].trim()
      
      // 숫자와 일반적인 단어 제거 (예: "1층", "42평" 등)
      businessName = businessName.replace(/\d+/g, '').trim()
      businessName = businessName.replace(/\s+/g, ' ').trim()
      
      // 너무 짧거나 일반적인 단어는 제외
      const excludedWords = ['상가', '매물', '건물', '사무실', '층', '평']
      if (businessName.length >= 2 && !excludedWords.some(word => businessName.includes(word))) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 패턴 기반 상호명 추출:', { 원본제목: title, 추출된상호명: businessName })
        }
        return businessName
      }
    }
  }

  return null
}

/**
 * 주소와 제목을 결합하여 정확한 좌표 찾기
 * @param address 주소 문자열
 * @param title 매물 제목 (선택적)
 * @returns Promise<Coordinates | null>
 */
export async function findCoordinatesByAddressAndTitle(
  address: string,
  title?: string
): Promise<Coordinates | null> {
  // 1. 제목에서 상호명 추출
  let keyword: string | null = null
  if (title) {
    keyword = extractBusinessName(title)
  }

  // 2. 상호명이 있으면 주소 + 상호명으로 키워드 검색
  if (keyword) {
    // 주소에서 동 이름 추출
    const dongMatch = address.match(/([가-힣]+동)/)
    const dong = dongMatch ? dongMatch[1] : ''
    
    // 우선순위 1: "대구 동명 상호명" 형식으로 검색 (가장 정확)
    const searchKeyword1 = dong ? `대구 ${dong} ${keyword}` : `대구 ${keyword}`
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 상호명 기반 키워드 검색 (우선순위 1):', { keyword, searchKeyword: searchKeyword1, address })
    }
    
    const keywordResult1 = await tryKeywordSearch(searchKeyword1)
    if (keywordResult1) {
      return keywordResult1
    }

    // 우선순위 2: 주소 전체 + 상호명으로 검색 (도로명 주소가 포함된 경우)
    if (address.includes('로') || address.includes('길') || address.includes('대로')) {
      const searchKeyword2 = `${address} ${keyword}`
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 상호명 기반 키워드 검색 (우선순위 2 - 도로명 주소):', { searchKeyword: searchKeyword2 })
      }
      const keywordResult2 = await tryKeywordSearch(searchKeyword2)
      if (keywordResult2) {
        return keywordResult2
      }
    }
  }

  // 3. 키워드 검색 실패 시 주소 검색 시도 (도로명 주소 우선)
  const addressResult = await tryAddressSearch(address)
  if (addressResult) {
    return addressResult
  }

  // 4. 주소 검색 실패 시 주소를 키워드로 검색
  const addressKeywordResult = await tryKeywordSearch(address)
  return addressKeywordResult
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

        // 대구 지역 우선 검색을 위해 키워드에 "대구" 추가
        const searchKeyword = keyword.includes('대구') ? keyword : `대구 ${keyword}`

        places.keywordSearch(searchKeyword, (result: any, status: any) => {
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
              console.error('키워드 검색 실패:', searchKeyword, status)
            }
            resolve(null)
          }
        })
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
 * 좌표에서 건물명/장소명 가져오기 (Places API 사용)
 * @param lat 위도
 * @param lng 경도
 * @returns Promise<{ buildingName: string | null; address: string | null }>
 */
export async function getBuildingInfoFromCoordinates(
  lat: number,
  lng: number
): Promise<{ buildingName: string | null; address: string | null }> {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
      resolve({ buildingName: null, address: null })
      return
    }

    // Kakao Maps API 대기
    const ready = await waitForKakaoMaps()
    if (!ready) {
      resolve({ buildingName: null, address: null })
      return
    }

      try {
        const places = new window.kakao.maps.services.Places()
        const geocoder = new window.kakao.maps.services.Geocoder()
        const coord = new window.kakao.maps.LatLng(lat, lng)
        
        let buildingName: string | null = null
        let address: string | null = null
        let resolved = false

        // 1. 역지오코딩으로 주소 가져오기
        geocoder.coord2Address(coord.getLng(), coord.getLat(), (geoResult: any, geoStatus: any) => {
          // 주소 추출
          if (geoStatus === window.kakao.maps.services.Status.OK && geoResult.length > 0) {
            // 도로명 주소 우선, 없으면 지번 주소
            address = geoResult[0].road_address?.address_name || geoResult[0].address?.address_name || null
            
            // 건물명 추출 (도로명 주소의 건물명 우선)
            if (geoResult[0].road_address?.building_name) {
              buildingName = geoResult[0].road_address.building_name
            }
          }

          // 2. 건물명이 없으면 Places API로 주변 장소 검색
          if (!buildingName && !resolved) {
            // 좌표 주변 장소 검색을 위해 주소를 키워드로 사용
            const searchKeyword = address ? address.split(' ').slice(-2).join(' ') : ''
            
            if (searchKeyword) {
              places.keywordSearch(searchKeyword, (placeResult: any, placeStatus: any) => {
                if (placeStatus === window.kakao.maps.services.Status.OK && placeResult.length > 0) {
                  // 가장 가까운 장소 선택
                  const nearestPlace = placeResult[0]
                  if (nearestPlace.place_name && !buildingName) {
                    buildingName = nearestPlace.place_name
                  }
                }
                
                if (!resolved) {
                  resolved = true
                  resolve({ 
                    buildingName: buildingName || null, 
                    address: address || null 
                  })
                }
              }, {
                location: coord,
                radius: 100, // 100m 반경
              })
            } else {
              // 주소가 없으면 바로 반환
              if (!resolved) {
                resolved = true
                resolve({ buildingName, address })
              }
            }
          } else {
            // 건물명이 이미 있으면 바로 반환
            if (!resolved) {
              resolved = true
              resolve({ buildingName, address })
            }
          }
        })
      } catch (error) {
        console.error('건물 정보 조회 실패:', error)
        resolve({ buildingName: null, address: null })
      }
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

