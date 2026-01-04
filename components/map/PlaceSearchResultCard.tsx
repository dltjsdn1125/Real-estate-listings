'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { PlaceSearchResult } from '@/lib/utils/geocoding'

interface PlaceSearchResultCardProps {
  place: PlaceSearchResult
  searchKeyword: string
  onLocationClick?: (address: string, coords: { lat: number; lng: number }) => void
}

export default function PlaceSearchResultCard({
  place,
  searchKeyword,
  onLocationClick,
}: PlaceSearchResultCardProps) {
  const { user, isAuthenticated } = useAuth()
  const [isPlaceFavorited, setIsPlaceFavorited] = useState(false)
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false)

  // 즐겨찾기 상태 확인
  useEffect(() => {
    if (!isAuthenticated || !user || !searchKeyword) return
    
    const checkFavorite = async () => {
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('keyword', searchKeyword)
          .eq('place_name', place.name)
          .maybeSingle()
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116은 "no rows found" 에러이므로 정상적인 경우
          console.error('즐겨찾기 확인 오류:', error)
        }
        
        setIsPlaceFavorited(!!data)
      } catch (error) {
        setIsPlaceFavorited(false)
      }
    }
    
    checkFavorite()
  }, [isAuthenticated, user, searchKeyword, place.name])

  // 로드뷰 URL 생성 (앱 내 페이지로 이동)
  const getRoadviewUrl = () => {
    const address = encodeURIComponent(place.roadAddress || place.address || place.name)
    const from = encodeURIComponent('/map')
    const keyword = searchKeyword ? encodeURIComponent(searchKeyword) : ''
    return `/roadview?lat=${place.lat}&lng=${place.lng}&address=${address}&from=${from}${keyword ? `&keyword=${keyword}` : ''}`
  }

  // 즐겨찾기 토글
  const handlePlaceFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isAuthenticated || !user) {
      alert('로그인이 필요합니다.')
      return
    }

    setIsCheckingFavorite(true)
    try {
      if (isPlaceFavorited) {
        // 즐겨찾기 제거
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('keyword', searchKeyword)
          .eq('place_name', place.name)
        
        if (error) throw error
        setIsPlaceFavorited(false)
      } else {
        // 즐겨찾기 추가 (키워드 기반, property_id 없이)
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            property_id: null, // Places 검색 결과는 property_id가 없음
            keyword: searchKeyword,
            place_name: place.name,
            place_address: place.roadAddress || place.address,
            place_lat: place.lat,
            place_lng: place.lng,
          })
        
        if (error) {
          // 필드가 없는 경우 에러 처리
          console.error('즐겨찾기 추가 오류:', error)
          // 필드가 없어도 키워드만으로 저장 시도
          try {
            const { error: retryError } = await supabase
              .from('user_favorites')
              .insert({
                user_id: user.id,
                keyword: searchKeyword,
              })
            if (retryError) throw retryError
            setIsPlaceFavorited(true)
          } catch (retryErr) {
            throw error // 원래 에러를 throw
          }
        } else {
          setIsPlaceFavorited(true)
        }
      }
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
      alert('즐겨찾기 처리 중 오류가 발생했습니다.')
    } finally {
      setIsCheckingFavorite(false)
    }
  }

  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLocationClick?.(place.address || place.roadAddress || place.name, {
      lat: place.lat,
      lng: place.lng
    })
  }

  return (
    <div className="group flex flex-col gap-3 bg-white dark:bg-[#151c2b] rounded-xl p-3 shadow-sm border border-primary/30 hover:border-primary/50 transition-all">
      <div 
        className="flex justify-between items-start gap-2 cursor-pointer"
        onClick={handleLocationClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs text-primary font-medium shrink-0">장소</span>
            <h4 className="text-sm md:text-base font-bold text-[#111318] dark:text-white leading-tight line-clamp-1">
              {place.name}
            </h4>
          </div>
          <p className="text-xs text-[#616f89] dark:text-gray-400 mt-1 line-clamp-1">
            {place.roadAddress || place.address}
          </p>
          {place.category && (
            <p className="text-xs text-[#616f89] dark:text-gray-400 mt-0.5">
              {place.category.split(' > ').pop()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAuthenticated && (
            <button
              onClick={handlePlaceFavorite}
              disabled={isCheckingFavorite}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
              title={isPlaceFavorited ? '즐겨찾기 제거' : '즐겨찾기 추가'}
            >
              <span className={`material-symbols-outlined text-[20px] ${
                isPlaceFavorited 
                  ? 'text-red-500' 
                  : 'text-gray-400 hover:text-red-500'
              }`}>
                {isPlaceFavorited ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          )}
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0">place</span>
        </div>
      </div>
      
      {/* 액션 버튼 영역 */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        {/* 로드뷰 보기 */}
        <Link
          href={getRoadviewUrl()}
          onClick={(e) => e.stopPropagation()}
          prefetch={true}
          className="h-7 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-xs font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">streetview</span>
          로드뷰 보기
        </Link>
        
        {/* 위치 보기 */}
        <button
          onClick={handleLocationClick}
          className="h-7 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-xs font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          위치 보기
        </button>
      </div>
    </div>
  )
}

