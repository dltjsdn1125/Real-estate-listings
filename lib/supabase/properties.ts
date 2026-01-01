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
}) {
  let query = supabase
    .from('properties')
    .select(`
      *,
      property_images(*),
      property_tags(*),
      creator:users!properties_created_by_fkey(full_name, email)
    `)
    .eq('is_public', true)
    .eq('status', 'available')

  if (filters?.district) {
    query = query.eq('district', filters.district)
  }
  if (filters?.propertyType) {
    query = query.eq('property_type', filters.propertyType)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  // 반경 검색 (PostGIS 또는 하버사인 공식 사용)
  if (filters?.centerLat && filters?.centerLng && filters?.radiusKm) {
    // 하버사인 공식을 사용한 반경 검색
    // PostgreSQL의 point 타입과 거리 계산 함수 사용
    // 또는 좌표 범위로 필터링 후 클라이언트에서 정확한 거리 계산
    const latRange = filters.radiusKm / 111.0 // 대략적인 위도 1도 = 111km
    const lngRange = filters.radiusKm / (111.0 * Math.cos((filters.centerLat * Math.PI) / 180))
    
    query = query
      .gte('latitude', filters.centerLat - latRange)
      .lte('latitude', filters.centerLat + latRange)
      .gte('longitude', filters.centerLng - lngRange)
      .lte('longitude', filters.centerLng + lngRange)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const result = await query.order('created_at', { ascending: false })
  
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

