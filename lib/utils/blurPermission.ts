import { User } from '@/lib/supabase/types'
import { supabase } from '@/lib/supabase/client'

// 블러 처리된 매물을 볼 수 있는지 확인
export async function canViewBlurred(user: User | null): Promise<boolean> {
  // 관리자는 항상 볼 수 있음
  if (user?.role === 'admin' || user?.role === 'agent') {
    return true
  }

  // 사용자에게 직접 권한이 있으면 볼 수 있음
  if (user?.can_view_blurred) {
    return true
  }

  // 시스템 관리자(platinum 등급 이상)는 항상 블러 없이 볼 수 있음
  const tierLevels: Record<string, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    premium: 4,
    platinum: 5,
  }
  
  const userTier = user?.tier || 'bronze'
  const userTierLevel = tierLevels[userTier] || 0
  const platinumLevel = tierLevels['platinum'] || 5
  
  // platinum 등급 이상(시스템 관리자)은 항상 블러 없이 볼 수 있음
  if (userTierLevel >= platinumLevel) {
    return true
  }

  // 관리자 설정에서 최소 tier 확인
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'blur_view_min_tier')
      .single()

    if (data?.setting_value) {
      const minTier = (data.setting_value as any).min_tier
      if (!minTier) return false

      const minTierLevel = tierLevels[minTier] || 0

      return userTierLevel >= minTierLevel
    }
  } catch (error) {
    console.error('블러 권한 확인 오류:', error)
  }

  return false
}

// tier 레벨 가져오기
export function getTierLevel(tier: string): number {
  const tierLevels: Record<string, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    premium: 4,
    platinum: 5,
  }
  return tierLevels[tier] || 0
}

