'use client'

import Image from 'next/image'

interface PropertyLocationMapProps {
  address?: string
  lat?: number | null
  lng?: number | null
  showDetailedLocation?: boolean
}

export default function PropertyLocationMap({
  address,
  lat,
  lng,
  showDetailedLocation = false,
}: PropertyLocationMapProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold text-[#111318] dark:text-white">Location</h3>
      <div className="w-full h-[320px] bg-[#f0f2f4] dark:bg-gray-800 rounded-xl overflow-hidden relative group">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWxiN7mOYtjeglDCLNSbdHMITQSp9kMZCLhLN0dLF9d1auJ0r5LApwByt674_SFML3TUvwYCReuzUqBlKWobiEDpIcMYro_gtb7Z0g6RLqKel8mxKz6WtWzbrxQ-Dt_aSTo5BxKQnmPv8f6k-ueP4VQF6yERXTrlm1fQ5s7ZIGxcM51KasacW-gx5-SHmvPJaDj-Qq9LMG5gksqAzFogyjEnyb-wHHKkkhlMrYuCNlwwSkgzsTlTpJ3SPkt2z0yDQ_kUjGKKW3Sek"
          alt="Map view showing Daegu streets"
          fill
          className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          sizes="100vw"
        />
        {/* Map Marker Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className="bg-primary text-white p-2 rounded-full shadow-lg animate-bounce">
            <span className="material-symbols-outlined block">location_on</span>
          </div>
          <div className="bg-white dark:bg-gray-900 px-3 py-1 rounded-full shadow-md mt-2 text-xs font-bold">
            Approximate Location
          </div>
        </div>
        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <button className="bg-white dark:bg-gray-900 p-2 rounded shadow text-gray-700 dark:text-gray-200 hover:bg-gray-50">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <button className="bg-white dark:bg-gray-900 p-2 rounded shadow text-gray-700 dark:text-gray-200 hover:bg-gray-50">
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
        </div>
      </div>
      {!showDetailedLocation && (
        <p className="text-sm text-[#616f89]">
          <span className="material-symbols-outlined text-[16px] align-text-bottom mr-1">
            visibility_off
          </span>
          Detailed location is provided after booking a visit for privacy reasons.
        </p>
      )}
    </div>
  )
}

