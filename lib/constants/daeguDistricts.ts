// 대구 각 구별 중심 좌표 및 정보

export interface DistrictInfo {
  name: string
  lat: number
  lng: number
  level: number // 지도 확대 레벨 (1-14, 낮을수록 확대)
}

export const DAEGU_DISTRICTS: Record<string, DistrictInfo> = {
  all: {
    name: '전체',
    lat: 35.8714,
    lng: 128.6014,
    level: 8, // 대구 전체가 보이는 레벨
  },
  중구: {
    name: '중구',
    lat: 35.8691,
    lng: 128.6061,
    level: 6,
  },
  동구: {
    name: '동구',
    lat: 35.8869,
    lng: 128.6358,
    level: 6,
  },
  서구: {
    name: '서구',
    lat: 35.8719,
    lng: 128.5592,
    level: 6,
  },
  남구: {
    name: '남구',
    lat: 35.8463,
    lng: 128.5973,
    level: 6,
  },
  북구: {
    name: '북구',
    lat: 35.8858,
    lng: 128.5828,
    level: 6,
  },
  수성구: {
    name: '수성구',
    lat: 35.8581,
    lng: 128.6311,
    level: 6,
  },
  달서구: {
    name: '달서구',
    lat: 35.8294,
    lng: 128.5325,
    level: 6,
  },
  달성군: {
    name: '달성군',
    lat: 35.7741,
    lng: 128.4311,
    level: 7, // 달성군은 면적이 넓어서 레벨 조정
  },
}

// 구 이름으로 좌표 가져오기
export function getDistrictCoordinates(district: string): DistrictInfo {
  return DAEGU_DISTRICTS[district] || DAEGU_DISTRICTS.all
}

// 모든 구 목록 가져오기
export function getAllDistricts(): string[] {
  return Object.keys(DAEGU_DISTRICTS).filter((key) => key !== 'all')
}

// 구 선택지 (UI용)
export function getDistrictOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'all', label: '전체' },
    ...getAllDistricts().map((district) => ({
      value: district,
      label: district,
    })),
  ]
}

