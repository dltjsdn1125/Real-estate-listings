import { supabase } from './client'

// 즐겨찾기 추가
export async function addFavorite(userId: string, propertyId: string, keyword?: string) {
  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: userId,
      property_id: propertyId,
      keyword: keyword || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 즐겨찾기 삭제
export async function removeFavorite(userId: string, propertyId: string) {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('property_id', propertyId)

  if (error) throw error
}

// 즐겨찾기 목록 조회
export async function getFavorites(userId: string) {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      *,
      properties:property_id (
        *,
        property_images(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 즐겨찾기 여부 확인
export async function isFavorite(userId: string, propertyId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116은 "no rows returned" 에러
    throw error
  }

  return !!data
}

