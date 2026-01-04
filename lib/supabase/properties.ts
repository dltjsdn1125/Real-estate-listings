import { supabase } from './client'
import type { Property, PropertyImage, PropertyTag } from './types'

// 매물 목록 조회
export async function getProperties(filters?: {
  district?: string
  propertyType?: string
  status?: string
  limit?: number
  offset?: number
  centerLat?: number
  centerLng?: number
  radiusKm?: number
  keyword?: string
}) {
  // 키워드 검색이 있으면 2단계 검색 (성능 최적화), 없으면 일반 검색
  // select를 먼저 호출하여 쿼리 빌더를 올바르게 초기화
  let baseQuery = supabase.from('properties').select('id')
  
  // 기본 필터 적용
  baseQuery = baseQuery.eq('is_public', true)
  
  // status 필터는 한 번만 적용 (filters에 있으면 그것을 사용, 없으면 기본값 'available')
  if (filters?.status) {
    baseQuery = baseQuery.eq('status', filters.status)
  } else {
    baseQuery = baseQuery.eq('status', 'available')
  }

  if (filters?.district && filters.district !== 'all') {
    baseQuery = baseQuery.eq('district', filters.district)
  }
  if (filters?.propertyType && filters.propertyType !== 'all') {
    baseQuery = baseQuery.eq('property_type', filters.propertyType)
  }

  // 반경 검색 (PostGIS 또는 하버사인 공식 사용)
  if (filters?.centerLat && filters?.centerLng && filters?.radiusKm) {
    // 하버사인 공식을 사용한 반경 검색
    // PostgreSQL의 point 타입과 거리 계산 함수 사용
    // 또는 좌표 범위로 필터링 후 클라이언트에서 정확한 거리 계산
    const latRange = filters.radiusKm / 111.0 // 대략적인 위도 1도 = 111km
    const lngRange = filters.radiusKm / (111.0 * Math.cos((filters.centerLat * Math.PI) / 180))
    
    baseQuery = baseQuery
      .gte('latitude', filters.centerLat - latRange)
      .lte('latitude', filters.centerLat + latRange)
      .gte('longitude', filters.centerLng - lngRange)
      .lte('longitude', filters.centerLng + lngRange)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
  }

  // 키워드 검색은 DB에서 하지 않고 클라이언트에서 필터링 (관리자 페이지와 동일한 구조)
  // filters.keyword는 무시됨 - 모든 매물을 가져온 후 클라이언트에서 필터링

  if (filters?.limit) {
    baseQuery = baseQuery.limit(filters.limit)
  }
  if (filters?.offset) {
    baseQuery = baseQuery.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  // 먼저 ID만 가져오기 (빠른 검색)
  const baseResult = await baseQuery.order('created_at', { ascending: false })
  
  if (baseResult.error) {
    return baseResult
  }
  
  // 결과가 없으면 빈 배열 반환
  if (!baseResult.data || baseResult.data.length === 0) {
    if (process.env.NODE_ENV === 'development' && filters?.keyword) {
      console.log('🔍 Supabase 쿼리 결과: 검색 결과 없음')
    }
    return { ...baseResult, data: [] }
  }
  
  // ID 목록 추출
  const propertyIds = baseResult.data.map((p: any) => p.id)
  
  // 이제 상세 정보를 join으로 가져오기 (ID 목록으로만 필터링, 이미 필터링된 결과)
  // ID 목록이 비어있으면 빈 배열 반환
  if (propertyIds.length === 0) {
    return { ...baseResult, data: [] }
  }
  
  // Supabase의 .in()은 최대 100개까지만 지원하므로, 더 많으면 배치로 처리
  let allData: any[] = []
  const batchSize = 100
  
  for (let i = 0; i < propertyIds.length; i += batchSize) {
    const batchIds = propertyIds.slice(i, i + batchSize)
    
    const query = supabase
      .from('properties')
      .select(`
        *,
        property_images(*),
        property_tags(*),
        creator:users!properties_created_by_fkey(full_name, email)
      `)
      .in('id', batchIds)
      .eq('is_public', true)
    
    const batchResult = await query.order('created_at', { ascending: false })
    
    if (batchResult.error) {
      return batchResult
    }
    
    if (batchResult.data) {
      allData = allData.concat(batchResult.data)
    }
  }

  // 디버깅: 최종 쿼리 확인
  if (process.env.NODE_ENV === 'development' && filters?.keyword) {
    console.log('🔍 상세 정보 쿼리 실행:', {
      keyword: filters.keyword,
      propertyIdsCount: propertyIds.length,
      batches: Math.ceil(propertyIds.length / batchSize)
    })
  }
  
  // 결과를 created_at 기준으로 정렬 (최신순)
  allData.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA
  })
  
  // limit 적용 (이미 baseQuery에서 적용했지만, 배치 처리로 인해 더 많을 수 있음)
  if (filters?.limit && allData.length > filters.limit) {
    allData = allData.slice(0, filters.limit)
  }
  
  const result = { data: allData, error: null }
  
  // 디버깅: 쿼리 결과 확인
  if (process.env.NODE_ENV === 'development' && filters?.keyword) {
    console.log('🔍 Supabase 쿼리 결과:', {
      keyword: filters.keyword,
      dataCount: result.data?.length || 0,
      error: null,
      hasError: false
    })
  }
  
  // 반경 검색인 경우 클라이언트에서 정확한 거리 계산 및 필터링
  if (filters?.centerLat && filters?.centerLng && filters?.radiusKm && result.data) {
    const filteredData = result.data.filter((property: any) => {
      if (!property.latitude || !property.longitude) return false
      
      const distance = calculateDistance(
        filters.centerLat!,
        filters.centerLng!,
        parseFloat(property.latitude),
        parseFloat(property.longitude)
      )
      
      return distance <= filters.radiusKm!
    })
    
    return { ...result, data: filteredData }
  }
  
  return result
}

// 하버사인 공식을 사용한 거리 계산 (km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// 매물 상세 조회
export async function getPropertyById(id: string) {
  return await supabase
    .from('properties')
    .select(`
      *,
      property_images(*),
      property_tags(*),
      creator:users!properties_created_by_fkey(*)
    `)
    .eq('id', id)
    .single()
}

// 매물 생성
export async function createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single()

  if (error) throw error
  return data
}

// 매물 수정
export async function updateProperty(
  id: string,
  updates: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 매물 이미지 추가
export async function addPropertyImages(images: Omit<PropertyImage, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('property_images')
    .insert(images)
    .select()

  if (error) throw error
  return data
}

// 매물 태그 추가
export async function addPropertyTags(tags: Omit<PropertyTag, 'id' | 'created_at'>[]) {
  const { data, error } = await supabase
    .from('property_tags')
    .insert(tags)
    .select()

  if (error) throw error
  return data
}

// 매물 태그 삭제
export async function deletePropertyTags(propertyId: string, tags: string[]) {
  const { error } = await supabase
    .from('property_tags')
    .delete()
    .eq('property_id', propertyId)
    .in('tag', tags)

  if (error) throw error
}


