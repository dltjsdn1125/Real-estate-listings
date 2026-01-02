'use client'

import { useState, useRef } from 'react'
import { uploadPropertyImage } from '@/lib/supabase/storage'
import { supabase } from '@/lib/supabase/client'

interface PropertyImageUploadProps {
  propertyId: string
  onUploadComplete?: () => void
  userId?: string
}

export default function PropertyImageUpload({
  propertyId,
  onUploadComplete,
  userId,
}: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // 현재 사용자 확인
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 파일 업로드 및 DB 저장
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}은(는) 이미지 파일이 아닙니다.`)
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name}의 크기가 5MB를 초과합니다.`)
        }

        // Supabase Storage에 업로드 (사용자 ID 포함)
        const publicUrl = await uploadPropertyImage(file, propertyId, user.id)

        // property_images 테이블에 저장
        const { error: insertError } = await supabase.from('property_images').insert({
          property_id: propertyId,
          image_url: publicUrl,
          image_alt: file.name,
          is_main: i === 0, // 첫 번째 이미지를 대표 이미지로 설정
          display_order: i,
        })

        if (insertError) {
          throw new Error(`이미지 저장 중 오류가 발생했습니다: ${insertError.message}`)
        }

        setUploadProgress(((i + 1) / files.length) * 100)
      }

      // 업로드 완료 콜백
      onUploadComplete?.()

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      console.error('이미지 업로드 오류:', err)
      setError(err.message || '이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#111318] dark:text-white">매물 이미지</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id="property-image-upload"
        />
        <label
          htmlFor="property-image-upload"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            uploading
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-blue-600'
          }`}
        >
          {uploading ? '업로드 중...' : '이미지 추가'}
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <p className="text-xs text-[#616f89] dark:text-gray-400">
        • 최대 5MB까지 업로드 가능합니다.
        <br />• 여러 이미지를 한 번에 업로드할 수 있습니다.
        <br />• 첫 번째 이미지가 대표 이미지로 설정됩니다.
      </p>
    </div>
  )
}

