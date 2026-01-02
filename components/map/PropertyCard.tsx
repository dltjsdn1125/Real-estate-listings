'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getRoadviewPanoId } from '@/lib/utils/roadview'

interface PropertyCardProps {
  id: string
  title: string
  location: string
  address?: string | null
  deposit: string
  rent: string
  area: string
  parking?: boolean
  type: 'standard' | 'premium'
  isNew?: boolean
  propertyType?: string
  isLocked?: boolean
  lat?: number
  lng?: number
  isOwner?: boolean
  onFavorite?: (id: string) => void
  onClick?: (id: string) => void
  onViewDetail?: (id: string) => void
  onEdit?: (id: string) => void
}

export default function PropertyCard({
  id,
  title,
  location,
  address,
  deposit,
  rent,
  area,
  parking,
  type,
  isNew = false,
  propertyType,
  isLocked = false,
  lat,
  lng,
  isOwner = false,
  onFavorite,
  onClick,
  onViewDetail,
  onEdit,
}: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [hasRoadview, setHasRoadview] = useState(false)
  const [isCheckingRoadview, setIsCheckingRoadview] = useState(false)

  // 로드뷰 존재 여부 확인
  useEffect(() => {
    if (!lat || !lng || typeof window === 'undefined') {
      setHasRoadview(false)
      return
    }

    const checkRoadview = async () => {
      setIsCheckingRoadview(true)
      try {
        // 카카오 맵 API가 로드될 때까지 대기
        let attempts = 0
        const maxAttempts = 20

        const waitForKakao = () => {
          return new Promise<boolean>((resolve) => {
            const checkInterval = setInterval(() => {
              attempts++
              if (window.kakao && window.kakao.maps && window.kakao.maps.RoadviewClient) {
                clearInterval(checkInterval)
                resolve(true)
              } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval)
                resolve(false)
              }
            }, 500)
          })
        }

        const kakaoReady = await waitForKakao()

        if (!kakaoReady) {
          setHasRoadview(false)
          return
        }

        // 로드뷰 체크
        const panoId = await getRoadviewPanoId(lat, lng)
        setHasRoadview(!!panoId)
      } catch (error: any) {
        setHasRoadview(false)
      } finally {
        setIsCheckingRoadview(false)
      }
    }

    // 약간의 지연 후 체크 (Kakao API 초기화 시간 확보)
    const timeoutId = setTimeout(checkRoadview, 1000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [lat, lng, id])

  const handleRoadviewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // 상세 페이지의 로드뷰 탭으로 이동
    window.location.href = `/properties/${id}#roadview`
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsFavorited(!isFavorited)
    onFavorite?.(id)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isLocked && onClick) {
      onClick(id)
    }
  }

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onViewDetail) {
      onViewDetail(id)
    }
  }

  if (type === 'premium') {
    return (
      <div
        className="relative group flex flex-col gap-3 bg-white dark:bg-[#151c2b] rounded-xl p-3 shadow-sm border border-yellow-400/30 overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        <div className="absolute top-0 right-0 bg-yellow-400 text-[#111318] text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">
          PREMIUM
        </div>
        <div>
          <h4 className="text-[#111318] dark:text-white text-base font-bold leading-tight">
            {title}
          </h4>
          <p className="text-[#616f89] dark:text-gray-400 text-sm mt-1">{location}</p>
          <div className="mt-2 select-none filter blur-sm opacity-60">
            <div className="flex items-baseline gap-1">
              <span className="text-primary font-bold text-lg">{deposit}</span>
              <span className="text-xs font-medium">보증금</span>
              <span className="text-xs px-1">/</span>
              <span className="text-primary font-bold text-lg">{rent}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <button className="shadow-lg bg-[#111318] dark:bg-primary text-white text-sm font-bold py-2 px-4 rounded-lg hover:scale-105 transition-transform">
              멤버십 플랜 보기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group flex flex-col gap-3 bg-white dark:bg-[#151c2b] rounded-xl p-3 shadow-sm border border-transparent hover:border-primary/30 transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            {/* 상호명 (제목) - 더 명확하게 표시 */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {propertyType === '상가' && (
                <span className="text-[#616f89] dark:text-gray-400 text-xs font-medium shrink-0">
                  상호
                </span>
              )}
              <h4 className="text-[#111318] dark:text-white text-base font-bold leading-tight line-clamp-1">
                {title}
              </h4>
            </div>
          </div>
          <button
            onClick={handleFavorite}
            className="material-symbols-outlined text-gray-400 hover:text-red-500 cursor-pointer text-[20px] transition-colors shrink-0"
          >
            {isFavorited ? 'favorite' : 'favorite_border'}
          </button>
        </div>
        <p className="text-[#616f89] dark:text-gray-400 text-sm mt-1">{location}</p>
        {address && (
          <p className="text-[#616f89] dark:text-gray-400 text-xs mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">place</span>
            <span className="line-clamp-1">{address}</span>
          </p>
        )}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-primary font-bold text-lg">{deposit}</span>
          <span className="text-[#616f89] dark:text-gray-400 text-xs font-medium">보증금</span>
          <span className="text-[#616f89] dark:text-gray-400 text-xs px-1">/</span>
          <span className="text-primary font-bold text-lg">{rent}</span>
          <span className="text-[#616f89] dark:text-gray-400 text-xs font-medium">월세</span>
        </div>
        <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1 text-[#616f89] dark:text-gray-500 text-xs">
            <span className="material-symbols-outlined text-[16px]">crop_square</span>
            <span>{area}</span>
          </div>
          {parking && (
            <div className="flex items-center gap-1 text-[#616f89] dark:text-gray-500 text-xs">
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
              <span>주차 가능</span>
            </div>
          )}
        </div>
        {/* 버튼 영역 - 2행 2열 그리드 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* 로드뷰 보기 */}
          {hasRoadview && lat && lng ? (
            <button
              onClick={handleRoadviewClick}
              className="h-9 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-sm font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">streetview</span>
              로드뷰 보기
            </button>
          ) : (
            <div className="h-9"></div>
          )}
          
          {/* 위치 보기 */}
          <button
            onClick={handleClick}
            className="h-9 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-sm font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            위치 보기
          </button>
          
          {/* 자세히 보기 */}
          <Link
            href={`/properties/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="h-9 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-sm font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            자세히 보기
          </Link>
          
          {/* 수정하기 (유저가 등록한 매물인 경우에만 표시) */}
          {isOwner ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(id)
              }}
              className="h-9 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-sm font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              수정하기
            </button>
          ) : (
            <div className="h-9"></div>
          )}
        </div>
      </div>
    </div>
  )
}
