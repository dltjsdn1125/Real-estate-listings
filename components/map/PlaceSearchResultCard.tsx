'use client'

import Link from 'next/link'
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

  // 로드뷰 URL 생성 (앱 내 페이지로 이동)
  const getRoadviewUrl = () => {
    const address = encodeURIComponent(place.roadAddress || place.address || place.name)
    const from = encodeURIComponent('/map')
    const keyword = searchKeyword ? encodeURIComponent(searchKeyword) : ''
    return `/roadview?lat=${place.lat}&lng=${place.lng}&address=${address}&from=${from}${keyword ? `&keyword=${keyword}` : ''}`
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

