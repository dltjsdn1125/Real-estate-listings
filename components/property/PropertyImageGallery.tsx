'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import KakaoRoadView from './KakaoRoadView'
import KakaoAerialView from './KakaoAerialView'

interface PropertyImage {
  url: string
  alt: string
}

interface PropertyImageGalleryProps {
  images: PropertyImage[]
  currentIndex?: number
  onImageClick?: (index: number) => void
  latitude?: number
  longitude?: number
  address?: string
  title?: string
}

export default function PropertyImageGallery({
  images,
  currentIndex = 0,
  onImageClick,
  latitude,
  longitude,
}: PropertyImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(currentIndex)
  const [viewMode, setViewMode] = useState<'images' | 'roadview'>('images')

  // 로드뷰 사용 가능 여부: 좌표가 있으면 사용 가능
  const hasRoadView = Boolean(latitude && longitude)

  // URL 해시를 확인하여 로드뷰 탭 자동 열기
  useEffect(() => {
    if (typeof window !== 'undefined' && hasRoadView) {
      const hash = window.location.hash
      if (hash === '#roadview') {
        setViewMode('roadview')
      }
    }
  }, [hasRoadView])

  // 이미지가 없고 로드뷰가 있으면 자동으로 로드뷰 탭으로 전환
  useEffect(() => {
    if (images.length === 0 && hasRoadView && viewMode === 'images') {
      setViewMode('roadview')
    }
  }, [images.length, hasRoadView, viewMode])

  const handleImageClick = (index: number) => {
    setSelectedIndex(index)
    onImageClick?.(index)
  }

  const mainImage = images[selectedIndex] || images[0]
  const subImages = images.slice(1, 3)

  return (
    <div className="flex flex-col gap-4">
      {/* 탭 버튼 */}
      {(images.length > 0 || hasRoadView) && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {images.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setViewMode('images')
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'images'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] align-middle mr-1">photo_library</span>
              사진 ({images.length})
            </button>
          )}
          {hasRoadView && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setViewMode('roadview')
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'roadview'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] align-middle mr-1">streetview</span>
              로드뷰
            </button>
          )}
        </div>
      )}

      {/* 이미지 갤러리 */}
      {viewMode === 'images' && images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[480px] rounded-xl overflow-hidden cursor-pointer group">
          {/* Main Image */}
          <div
            className="relative w-full h-full bg-gray-200 md:row-span-2"
            onClick={(e) => {
              e.stopPropagation()
              handleImageClick(0)
            }}
          >
            {mainImage.url.includes('dapi.kakao.com') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mainImage.url}
                alt={mainImage.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <Image
                src={mainImage.url}
                alt={mainImage.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            )}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              {selectedIndex + 1}/{images.length}
            </div>
          </div>
          {/* Sub Images */}
          {subImages.length > 0 && (
            <>
              <div
                className="hidden md:block relative w-full h-full bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  handleImageClick(1)
                }}
              >
                {subImages[0].url.includes('dapi.kakao.com') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={subImages[0].url}
                    alt={subImages[0].alt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={subImages[0].url}
                    alt={subImages[0].alt}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                )}
              </div>
              {subImages.length > 1 && (
                <div
                  className="hidden md:block relative w-full h-full bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleImageClick(2)
                  }}
                >
                  {subImages[1].url.includes('dapi.kakao.com') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={subImages[1].url}
                      alt={subImages[1].alt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={subImages[1].url}
                      alt={subImages[1].alt}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold border border-white px-4 py-2 rounded-lg">
                      View All Photos
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 이미지가 없을 때 빈 컨테이너 표시 (로드뷰가 없을 때만) */}
      {viewMode === 'images' && images.length === 0 && !hasRoadView && (
        <div className="w-full h-[400px] md:h-[480px] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center p-8">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4 block">
              image
            </span>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              등록된 이미지가 없습니다
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              이미지를 업로드하면 여기에 표시됩니다
            </p>
          </div>
        </div>
      )}

      {/* 이미지가 없고 로드뷰가 있을 때는 로드뷰로 자동 전환 */}
      {viewMode === 'images' && images.length === 0 && hasRoadView && (
        <div className="w-full h-[400px] md:h-[480px] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center p-8">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4 block">
              image
            </span>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              등록된 이미지가 없습니다
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              로드뷰 탭에서 위치를 확인할 수 있습니다
            </p>
          </div>
        </div>
      )}

      {/* 로드뷰 + 항공뷰 */}
      {viewMode === 'roadview' && hasRoadView && (
        <div className="flex flex-col md:flex-row gap-4 rounded-xl overflow-hidden">
          {/* 로드뷰 (50%) */}
          <div className="w-full md:w-1/2 rounded-xl overflow-hidden">
            <KakaoRoadView
              key={`roadview-${latitude}-${longitude}`}
              latitude={latitude!}
              longitude={longitude!}
              height="300px"
              className="w-full"
            />
          </div>
          {/* 항공뷰 (50%) */}
          <div className="w-full md:w-1/2 rounded-xl overflow-hidden">
            <KakaoAerialView
              latitude={latitude!}
              longitude={longitude!}
              height="300px"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* 이미지도 없고 로드뷰도 없을 때 빈 컨테이너 표시 */}
      {images.length === 0 && !hasRoadView && (
        <div className="w-full h-[400px] md:h-[480px] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center p-8">
            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4 block">
              image
            </span>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              등록된 이미지가 없습니다
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
              이미지를 업로드하면 여기에 표시됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

