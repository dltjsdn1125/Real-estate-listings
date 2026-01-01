import { User, UserTier } from '@/lib/supabase/types'

// 권한 타입 정의 (UserTier + role)
type RoleType = 'guest' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'premium' | 'agent' | 'admin'

// 권한 레벨 정의
export const PERMISSIONS: Record<string, RoleType[]> = {
  // 매물 조회
  VIEW_BASIC_INFO: ['guest', 'bronze', 'silver', 'gold', 'platinum', 'agent', 'admin'],
  VIEW_DETAILED_PHOTOS: ['guest', 'bronze', 'silver', 'gold', 'platinum', 'agent', 'admin'],
  VIEW_KEY_MONEY: ['silver', 'gold', 'platinum', 'agent', 'admin'], // 권리금 (인증회원 이상)
  VIEW_AGENT_INFO: ['bronze', 'silver', 'gold', 'platinum', 'agent', 'admin'], // 중개자 정보
  VIEW_MARKET_DATA: ['silver', 'gold', 'platinum', 'agent', 'admin'], // 상권 데이터

  // 매물 관리
  CREATE_PROPERTY: ['agent', 'admin'],
  EDIT_PROPERTY: ['agent', 'admin'],
  DELETE_PROPERTY: ['admin'],

  // 사용자 관리
  VIEW_USERS: ['admin'],
  APPROVE_USERS: ['admin'],
  EDIT_USER_TIER: ['admin'],

  // 프리미엄 기능
  ACCESS_PREMIUM_PROPERTIES: ['gold', 'platinum', 'agent', 'admin'],
  EXPORT_DATA: ['platinum', 'agent', 'admin'],
  API_ACCESS: ['platinum', 'agent', 'admin'],
}

// 사용자 역할 확인
export function hasPermission(
  user: User | null,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!user) {
    // 비회원은 guest 권한
    return PERMISSIONS[permission].includes('guest')
  }

  // 승인되지 않은 사용자는 guest 권한
  if (user.approval_status !== 'approved') {
    return PERMISSIONS[permission].includes('guest')
  }

  // admin 역할은 모든 권한 보유
  if (user.role === 'admin') {
    return true
  }

  // agent 역할 확인
  if (user.role === 'agent') {
    return PERMISSIONS[permission].includes('agent')
  }

  // tier에 따른 권한 확인
  return PERMISSIONS[permission].includes(user.tier)
}

// 사용자 tier 레벨 비교
export function getTierLevel(tier: string): number {
  const tierLevels: Record<string, number> = {
    guest: 0,
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 4,
    premium: 5,
  }
  return tierLevels[tier] || 0
}

// tier 비교
export function isTierHigherOrEqual(userTier: string, requiredTier: string): boolean {
  return getTierLevel(userTier) >= getTierLevel(requiredTier)
}

// 등급별 설명
export const TIER_DESCRIPTIONS: Record<string, string> = {
  guest: '비회원 - 기본 정보만 조회 가능',
  bronze: '일반 회원 - 중개자 정보 조회 가능',
  silver: '인증 회원 - 권리금 및 상권 데이터 조회 가능',
  gold: '골드 회원 - 프리미엄 매물 접근 가능',
  platinum: '플래티넘 회원 - 데이터 추출 및 API 접근 가능',
  premium: '프리미엄 회원 - 모든 기능 접근 가능',
}

// 등급별 혜택
export const TIER_BENEFITS: Record<string, string[]> = {
  guest: ['기본 매물 정보 조회', '매물 사진 조회'],
  bronze: ['기본 매물 정보 조회', '매물 사진 조회', '중개자 정보 조회'],
  silver: [
    '기본 매물 정보 조회',
    '매물 사진 조회',
    '중개자 정보 조회',
    '권리금 정보 조회',
    '상권 데이터 조회',
  ],
  gold: [
    '기본 매물 정보 조회',
    '매물 사진 조회',
    '중개자 정보 조회',
    '권리금 정보 조회',
    '상권 데이터 조회',
    '프리미엄 매물 접근',
  ],
  platinum: [
    '기본 매물 정보 조회',
    '매물 사진 조회',
    '중개자 정보 조회',
    '권리금 정보 조회',
    '상권 데이터 조회',
    '프리미엄 매물 접근',
    '데이터 추출',
    'API 접근',
  ],
  premium: [
    '기본 매물 정보 조회',
    '매물 사진 조회',
    '중개자 정보 조회',
    '권리금 정보 조회',
    '상권 데이터 조회',
    '프리미엄 매물 접근',
    '데이터 추출',
    'API 접근',
    '모든 기능',
  ],
}

