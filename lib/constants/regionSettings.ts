// 지역 설정 상수

export type RegionType = 'daegu' | 'nationwide' | 'custom'

export interface RegionInfo {
  type: RegionType
  name: string
  lat: number
  lng: number
  level: number
  searchKeyword?: string // 검색 시 사용할 키워드 (예: "대구", "서울", "부산" 등)
}

export const REGION_SETTINGS: Record<RegionType, RegionInfo> = {
  daegu: {
    type: 'daegu',
    name: '대구',
    lat: 35.8714,
    lng: 128.6014,
    level: 8,
    searchKeyword: '대구',
  },
  nationwide: {
    type: 'nationwide',
    name: '전국',
    lat: 36.5,
    lng: 127.5,
    level: 7,
    searchKeyword: undefined, // 전국 검색은 키워드 없음
  },
  custom: {
    type: 'custom',
    name: '사용자 지정',
    lat: 35.8714,
    lng: 128.6014,
    level: 8,
    searchKeyword: undefined,
  },
}

// 주요 도시 목록 (사용자 지정 지역 선택용)
export const MAJOR_CITIES: Array<{ name: string; lat: number; lng: number; level: number }> = [
  { name: '서울', lat: 37.5665, lng: 126.9780, level: 8 },
  { name: '부산', lat: 35.1796, lng: 129.0756, level: 8 },
  { name: '대구', lat: 35.8714, lng: 128.6014, level: 8 },
  { name: '인천', lat: 37.4563, lng: 126.7052, level: 8 },
  { name: '광주', lat: 35.1595, lng: 126.8526, level: 8 },
  { name: '대전', lat: 36.3504, lng: 127.3845, level: 8 },
  { name: '울산', lat: 35.5384, lng: 129.3114, level: 8 },
  { name: '세종', lat: 36.4800, lng: 127.2890, level: 8 },
  { name: '수원', lat: 37.2636, lng: 127.0286, level: 8 },
  { name: '성남', lat: 37.4201, lng: 127.1267, level: 8 },
  { name: '고양', lat: 37.6584, lng: 126.8320, level: 8 },
  { name: '용인', lat: 37.2411, lng: 127.1776, level: 8 },
  { name: '청주', lat: 36.6424, lng: 127.4890, level: 8 },
  { name: '천안', lat: 36.8151, lng: 127.1139, level: 8 },
  { name: '전주', lat: 35.8242, lng: 127.1480, level: 8 },
  { name: '포항', lat: 36.0322, lng: 129.3650, level: 8 },
  { name: '제주', lat: 33.4996, lng: 126.5312, level: 8 },
]

// localStorage 키
export const REGION_SETTING_KEY = 'map_region_setting'

