import { supabase } from './client'

const BUCKET_NAME = 'property-images'

// 이미지 업로드
export async function uploadPropertyImage(
  file: File,
  propertyId: string,
  userId?: string,
  fileName?: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  // 사용자 ID가 있으면 경로에 포함 (정책에서 사용자별 접근 제어를 위해)
  const filePath = userId
    ? `${userId}/${propertyId}/${fileName || `${Date.now()}.${fileExt}`}`
    : `${propertyId}/${fileName || `${Date.now()}.${fileExt}`}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  // 공개 URL 가져오기
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return publicUrl
}

// 이미지 삭제
export async function deletePropertyImage(filePath: string) {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

  if (error) throw error
}

// 여러 이미지 업로드
export async function uploadPropertyImages(
  files: File[],
  propertyId: string
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadPropertyImage(file, propertyId, `image-${index}.${file.name.split('.').pop()}`)
  )

  return Promise.all(uploadPromises)
}

