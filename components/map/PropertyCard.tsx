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
  isBlurred?: boolean
  canViewBlurred?: boolean
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
  isBlurred = false,
  canViewBlurred = false,
  onFavorite,
  onClick,
  onViewDetail,
  onEdit,
}: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [hasRoadview, setHasRoadview] = useState(false)
  const [isCheckingRoadview, setIsCheckingRoadview] = useState(false)

  // 로드뷰 존재 여부 확인 - 지연 로딩 (화면에 보일 때만 체크)
  useEffect(() => {
    if (!lat || !lng || typeof window === 'undefined') {
      setHasRoadview(false)
      return
    }

    const checkRoadview = async () => {
      setIsCheckingRoadview(true)
      try {
        // 카카오 맵 API가 로드될 때까지 대기 (최대 시도 횟수 감소)
        let attempts = 0
        const maxAttempts = 10 // 20에서 10으로 감소

        const waitForKakao = () => {
          return new Promise<boolean>((resolve) => {
            // 체크 간격 단축
            const checkInterval = setInterval(() => {
              attempts++
              if (window.kakao && window.kakao.maps && window.kakao.maps.RoadviewClient) {
                clearInterval(checkInterval)
                resolve(true)
              } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval)
                resolve(false)
              }
            }, 100) // 200/500에서 100으로 단축
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

    // Intersection Observer로 화면에 보일 때만 체크
    const cardElement = document.getElementById(`property-card-${id}`)
    if (!cardElement) {
      // 카드가 아직 DOM에 없으면 약간의 지연 후 다시 시도
      const timeoutId = setTimeout(() => {
        const retryElement = document.getElementById(`property-card-${id}`)
        if (retryElement) {
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  observer.disconnect()
                  checkRoadview()
                }
              })
            },
            {
              rootMargin: '100px',
              threshold: 0.1,
            }
          )
          observer.observe(retryElement)
        } else {
          // 여전히 없으면 기본값으로 설정
          setHasRoadview(false)
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 화면에 보이기 시작하면 로드뷰 체크
          if (entry.isIntersecting) {
            observer.disconnect()
            checkRoadview()
          }
        })
      },
      {
        rootMargin: '100px', // 화면 밖 100px 전에 미리 체크
        threshold: 0.1,
      }
    )

    observer.observe(cardElement)

    return () => {
      observer.disconnect()
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

  // 블러 처리 여부 결정
  const shouldBlur = isBlurred && !canViewBlurred

  return (
    <div
      id={`property-card-${id}`}
      className={`group flex flex-col gap-3 bg-white dark:bg-[#151c2b] rounded-xl p-3 shadow-sm border ${
        type === 'premium' ? 'border-yellow-400/30' : 'border-transparent hover:border-primary/30'
      } transition-all cursor-pointer`}
      onClick={handleClick}
    >
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            {/* 상호명 (제목) - 더 명확하게 표시 */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {type === 'premium' && (
                <span className="bg-yellow-400 text-[#111318] text-[10px] font-bold px-2 py-0.5 rounded mr-1">
                  PREMIUM
                </span>
              )}
              {propertyType === '상가' && (
                <span className="text-[#616f89] dark:text-gray-400 text-xs font-medium shrink-0">
                  상호
                </span>
              )}
              <h4 className="text-[#111318] dark:text-white text-sm md:text-base font-bold leading-tight line-clamp-1">
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
        <div className={`mt-2 flex items-baseline gap-1 ${shouldBlur ? 'filter blur-sm opacity-60 select-none pointer-events-none' : ''}`}>
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
              className="h-7 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-xs font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">streetview</span>
              로드뷰 보기
            </button>
          ) : (
            <div className="h-7"></div>
          )}
          
          {/* 위치 보기 */}
          <button
            onClick={handleClick}
            className="h-7 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-xs font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            위치 보기
          </button>
          
          {/* 자세히 보기 */}
          <Link
            href={`/properties/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="h-7 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-xs font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            자세히 보기
          </Link>
          
          {/* 수정하기 (유저가 등록한 매물인 경우에만 표시) */}
          {isOwner ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(id)
              }}
              className="h-7 rounded-lg bg-white dark:bg-gray-800 text-[#111318] dark:text-white text-xs font-medium flex items-center justify-center gap-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              수정하기
            </button>
          ) : (
            <div className="h-7"></div>
          )}
        </div>
      </div>
    </div>
  )
}
