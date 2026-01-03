'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { getProperties } from '@/lib/supabase/properties'

interface FavoritePropertyModalProps {
  isOpen: boolean
  onClose: () => void
  keyword: string
  onSuccess?: () => void
}

export default function FavoritePropertyModal({
  isOpen,
  onClose,
  keyword,
  onSuccess,
}: FavoritePropertyModalProps) {
  const { user, isAuthenticated } = useAuth()
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && keyword && isAuthenticated) {
      searchProperties()
    }
  }, [isOpen, keyword, isAuthenticated])

  const searchProperties = async () => {
    if (!keyword.trim()) return

    setLoading(true)
    try {
      // 키워드로 매물 검색 (제목, 주소, 설명에서 검색)
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(*)
        `)
        .or(`title.ilike.%${keyword}%,address.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .eq('status', 'available')
        .limit(20)

      if (error) throw error

      if (data) {
        setProperties(data)
        // 이미 즐겨찾기에 있는 매물 확인
        if (user) {
          const { data: favorites } = await supabase
            .from('user_favorites')
            .select('property_id')
            .eq('user_id', user.id)
            .in('property_id', data.map((p) => p.id))

          if (favorites) {
            setSelectedProperties(new Set(favorites.map((f) => f.property_id)))
          }
        }
      }
    } catch (error) {
      console.error('매물 검색 오류:', error)
      alert('매물 검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties)
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId)
    } else {
      newSelected.add(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      // 현재 즐겨찾기 목록 가져오기
      const { data: currentFavorites } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', user.id)
        .in('property_id', properties.map((p) => p.id))

      const currentFavoriteIds = new Set(
        currentFavorites?.map((f) => f.property_id) || []
      )

      // 추가할 매물 (선택되었지만 현재 즐겨찾기에 없음)
      const toAdd = Array.from(selectedProperties).filter(
        (id) => !currentFavoriteIds.has(id)
      )

      // 삭제할 매물 (현재 즐겨찾기에 있지만 선택 해제됨)
      const toRemove = Array.from(currentFavoriteIds).filter(
        (id) => !selectedProperties.has(id)
      )

      // 추가
      if (toAdd.length > 0) {
        const { error } = await supabase.from('user_favorites').insert(
          toAdd.map((propertyId) => ({
            user_id: user.id,
            property_id: propertyId,
            keyword: keyword,
          }))
        )

        if (error) throw error
      }

      // 삭제
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .in('property_id', toRemove)

        if (error) throw error
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('즐겨찾기 저장 오류:', error)
      alert('즐겨찾기 저장 중 오류가 발생했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-[#111318] rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#111318] dark:text-white">
              즐겨찾기 매물 등록
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
              키워드: &quot;{keyword}&quot;
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="material-symbols-outlined text-[24px] sm:text-[28px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-6 sm:py-12">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {properties.length === 0 ? (
                <div className="text-center py-6 sm:py-12 text-gray-500">
                  <span className="material-symbols-outlined text-3xl sm:text-5xl mb-2 opacity-50">
                    search_off
                  </span>
                  <p className="text-xs sm:text-sm">검색 결과가 없습니다.</p>
                </div>
              ) : (
                properties.map((property) => {
                  const isSelected = selectedProperties.has(property.id)
                  return (
                    <div
                      key={property.id}
                      className={`p-2 sm:p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                      onClick={() => toggleProperty(property.id)}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProperty(property.id)}
                          className="mt-0.5 sm:mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-[#111318] dark:text-white truncate">
                            {property.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                            {property.address}
                          </p>
                          <div className="flex gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm">
                            <span>
                              보증금:{' '}
                              {property.deposit
                                ? `${(property.deposit / 10000).toLocaleString()}만`
                                : 'N/A'}
                            </span>
                            <span>
                              월세:{' '}
                              {property.monthly_rent
                                ? `${(property.monthly_rent / 10000).toLocaleString()}만`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 sm:p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={selectedProperties.size === 0}
            className="px-3 sm:px-6 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            저장 ({selectedProperties.size}개)
          </button>
        </div>
      </div>
    </div>
  )
}

