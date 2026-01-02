/**
 * 매물 좌표 수정 스크립트
 * 주소와 좌표가 불일치하는 매물을 찾아서 수정
 */

import { supabase } from '../lib/supabase/client'
import { addressToCoordinates, waitForKakaoMaps } from '../lib/utils/geocoding'

interface Property {
  id: string
  title: string
  address: string
  latitude: number | null
  longitude: number | null
}

async function fixPropertyCoordinates(propertyId: string) {
  // Kakao Maps API 로드 대기
  if (typeof window !== 'undefined') {
    await waitForKakaoMaps()
  }

  // 매물 정보 가져오기
  const { data: property, error } = await supabase
    .from('properties')
    .select('id, title, address, latitude, longitude')
    .eq('id', propertyId)
    .single()

  if (error || !property) {
    console.error('매물을 찾을 수 없습니다:', error)
    return
  }

  console.log('현재 매물 정보:', property)

  // 주소로부터 좌표 가져오기
  if (property.address) {
    const coords = await addressToCoordinates(property.address)
    
    if (coords) {
      console.log('주소로부터 변환된 좌표:', coords)
      
      // 좌표 업데이트
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId)

      if (updateError) {
        console.error('좌표 업데이트 실패:', updateError)
      } else {
        console.log('✅ 좌표 업데이트 완료')
      }
    } else {
      console.warn('주소로부터 좌표를 찾을 수 없습니다.')
    }
  }
}

// 사용 예시
// fixPropertyCoordinates('aaa9c079-2895-402d-97a2-f1c4302c7b9d')

export { fixPropertyCoordinates }

