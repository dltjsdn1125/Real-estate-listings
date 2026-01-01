'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface PropertyCardProps {
  id: string
  title: string
  location: string
  deposit: string
  rent: string
  area: string
  parking?: boolean
  type: 'standard' | 'premium'
  imageUrl: string
  imageAlt: string
  isNew?: boolean
  propertyType?: string
  isLocked?: boolean
  onFavorite?: (id: string) => void
  onClick?: (id: string) => void
}

export default function PropertyCard({
  id,
  title,
  location,
  deposit,
  rent,
  area,
  parking,
  type,
  imageUrl,
  imageAlt,
  isNew = false,
  propertyType,
  isLocked = false,
  onFavorite,
  onClick,
}: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    onFavorite?.(id)
  }

  const handleClick = () => {
    if (!isLocked) {
      onClick?.(id)
    }
  }

  if (type === 'premium') {
    return (
      <Link
        href={isLocked ? '#' : `/properties/${id}`}
        className="relative group flex flex-col gap-3 bg-white dark:bg-[#151c2b] rounded-xl p-3 shadow-sm border border-yellow-400/30 overflow-hidden block"
        onClick={isLocked ? (e) => e.preventDefault() : undefined}
      >
        <div className="absolute top-0 right-0 bg-yellow-400 text-[#111318] text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10">
          PREMIUM
        </div>
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover blur-[2px]"
              sizes="(max-width: 768px) 100vw, 450px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[48px]">image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="bg-white/90 dark:bg-black/80 rounded-full p-2">
              <span className="material-symbols-outlined text-gray-500 text-[24px]">lock</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-[#111318] dark:text-white text-base font-bold leading-tight">
            {title}
          </h4>
          <p className="text-[#616f89] dark:text-gray-400 text-sm mt-1">{location}</p>
          <div className="mt-2 select-none filter blur-sm opacity-60">
            <div className="flex items-baseline gap-1">
              <span className="text-primary font-bold text-lg">{deposit}</span>
              <span className="text-xs font-medium">Deposit</span>
              <span className="text-xs px-1">/</span>
              <span className="text-primary font-bold text-lg">{rent}</span>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 top-[60%] flex items-center justify-center">
            <button className="shadow-lg bg-[#111318] dark:bg-primary text-white text-sm font-bold py-2 px-4 rounded-lg hover:scale-105 transition-transform">
              View Membership Plans
            </button>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/properties/${id}`}
      className="group flex flex-col gap-3 bg-white dark:bg-[#151c2b] rounded-xl p-3 shadow-sm border border-transparent hover:border-primary/30 transition-all cursor-pointer block"
    >
      <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 450px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[48px]">image</span>
          </div>
        )}
        {isNew && (
          <div className="absolute top-2 left-2 bg-[#111318]/80 text-white text-[10px] font-bold px-2 py-1 rounded">
            NEW
          </div>
        )}
        {propertyType && (
          <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/80 text-primary font-bold text-xs px-2 py-1 rounded shadow-sm">
            {propertyType}
          </div>
        )}
      </div>
      <div>
        <div className="flex justify-between items-start">
          <h4 className="text-[#111318] dark:text-white text-base font-bold leading-tight">
            {title}
          </h4>
          <button
            onClick={handleFavorite}
            className="material-symbols-outlined text-gray-400 hover:text-red-500 cursor-pointer text-[20px] transition-colors"
          >
            {isFavorited ? 'favorite' : 'favorite_border'}
          </button>
        </div>
        <p className="text-[#616f89] dark:text-gray-400 text-sm mt-1">{location}</p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-primary font-bold text-lg">{deposit}</span>
          <span className="text-[#616f89] dark:text-gray-400 text-xs font-medium">Deposit</span>
          <span className="text-[#616f89] dark:text-gray-400 text-xs px-1">/</span>
          <span className="text-primary font-bold text-lg">{rent}</span>
          <span className="text-[#616f89] dark:text-gray-400 text-xs font-medium">Rent</span>
        </div>
        <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1 text-[#616f89] dark:text-gray-500 text-xs">
            <span className="material-symbols-outlined text-[16px]">crop_square</span>
            <span>{area}</span>
          </div>
          {parking && (
            <div className="flex items-center gap-1 text-[#616f89] dark:text-gray-500 text-xs">
              <span className="material-symbols-outlined text-[16px]">directions_car</span>
              <span>Parking OK</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

