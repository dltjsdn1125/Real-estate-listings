'use client'

import Image from 'next/image'
import { useState } from 'react'

interface PropertyImage {
  url: string
  alt: string
}

interface PropertyImageGalleryProps {
  images: PropertyImage[]
  currentIndex?: number
  onImageClick?: (index: number) => void
}

export default function PropertyImageGallery({
  images,
  currentIndex = 0,
  onImageClick,
}: PropertyImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(currentIndex)

  const handleImageClick = (index: number) => {
    setSelectedIndex(index)
    onImageClick?.(index)
  }

  if (images.length === 0) return null

  const mainImage = images[selectedIndex] || images[0]
  const subImages = images.slice(1, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] md:h-[480px] rounded-xl overflow-hidden cursor-pointer group">
      {/* Main Image */}
      <div
        className="relative w-full h-full bg-gray-200 md:row-span-2"
        onClick={() => handleImageClick(0)}
      >
        <Image
          src={mainImage.url}
          alt={mainImage.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
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
            onClick={() => handleImageClick(1)}
          >
            <Image
              src={subImages[0].url}
              alt={subImages[0].alt}
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
          {subImages.length > 1 && (
            <div
              className="hidden md:block relative w-full h-full bg-gray-200"
              onClick={() => handleImageClick(2)}
            >
              <Image
                src={subImages[1].url}
                alt={subImages[1].alt}
                fill
                className="object-cover"
                sizes="25vw"
              />
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
  )
}

