'use client'

import { useState } from 'react'
import { addressToCoordinates, waitForKakaoMaps } from '@/lib/utils/geocoding'

interface CentralSearchBarProps {
  onSearchAddress?: (address: string, coords: { lat: number; lng: number }) => void
  onKeywordSearch?: (keyword: string) => void
}

export default function CentralSearchBar({ onSearchAddress, onKeywordSearch }: CentralSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // 카카오 지도 API 대기
      const isReady = await waitForKakaoMaps()
      if (!isReady) {
        alert('지도 API를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
        setIsSearching(false)
        return
      }

      const query = searchQuery.trim()

      // 먼저 키워드 검색 수행 (매물 검색)
      if (query) {
        onKeywordSearch?.(query)
      }

      // 주소 또는 키워드로 좌표 변환 시도 (지도 이동용)
      try {
        const coords = await addressToCoordinates(query)
        if (coords) {
          // 지도 이동
          onSearchAddress?.(query, coords)
        }
      } catch (coordError) {
        // 좌표 변환 실패해도 키워드 검색은 이미 수행됨
        console.log('좌표 변환 실패, 키워드 검색만 수행:', coordError)
      }
    } catch (error) {
      console.error('검색 오류:', error)
      alert('검색 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4">
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="flex w-full items-stretch rounded-lg h-12 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
          <input
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-transparent text-[#111318] dark:text-white focus:outline-none placeholder:text-[#616f89] dark:placeholder:text-gray-500 px-4 text-base font-normal leading-normal"
            placeholder="장소, 건물명, 주소 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
            title="장소명, 건물명, 주소를 입력하면 지도가 해당 위치로 이동합니다"
          />
          {isSearching ? (
            <div className="flex items-center justify-center px-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : (
            <button
              type="submit"
              className="flex items-center justify-center px-4 text-[#616f89] dark:text-gray-400 hover:text-primary transition-colors"
              disabled={isSearching}
              title="검색"
            >
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

