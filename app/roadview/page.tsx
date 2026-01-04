'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Script from 'next/script'
import KakaoRoadView from '@/components/property/KakaoRoadView'
import Header from '@/components/common/Header'

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

function RoadviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // 초기 렌더링 시 즉시 파싱하여 지연 최소화
  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const addressParam = searchParams.get('address') || ''
  const fromParam = searchParams.get('from') || '/map'
  const keywordParam = searchParams.get('keyword') || ''
  
  const [lat, setLat] = useState<number | null>(() => {
    if (latParam) {
      const parsed = parseFloat(latParam)
      return !isNaN(parsed) ? parsed : null
    }
    return null
  })
  const [lng, setLng] = useState<number | null>(() => {
    if (lngParam) {
      const parsed = parseFloat(lngParam)
      return !isNaN(parsed) ? parsed : null
    }
    return null
  })
  const [address, setAddress] = useState<string>(addressParam)
  
  // 돌아가기 핸들러
  const handleBack = () => {
    if (fromParam && fromParam !== '/map') {
      router.push(fromParam)
    } else if (keywordParam) {
      // 검색 키워드가 있으면 검색 결과 페이지로 이동
      router.push(`/map?keyword=${encodeURIComponent(keywordParam)}`)
    } else {
      router.push('/map')
    }
  }

  useEffect(() => {
    if (!lat || !lng) {
      if (latParam && lngParam) {
        const latitude = parseFloat(latParam)
        const longitude = parseFloat(lngParam)
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          setLat(latitude)
          setLng(longitude)
          setAddress(addressParam)
        } else {
          router.push('/map')
        }
      } else {
        router.push('/map')
      }
    }
  }, [latParam, lngParam, addressParam, lat, lng, router])

  if (!lat || !lng) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header showSearch={true} />
        <main className="flex justify-center items-center min-h-[calc(100vh-73px)]">
          <span className="loading loading-spinner loading-lg"></span>
        </main>
      </div>
    )
  }

  return (
    <>
      {/* 카카오 맵 스크립트 미리 로드 */}
      {KAKAO_MAP_API_KEY && (
        <Script
          src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
          strategy="afterInteractive"
          onLoad={() => {
            if (window.kakao && window.kakao.maps) {
              window.kakao.maps.load(() => {
                // 스크립트 로드 완료
              })
            }
          }}
        />
      )}
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header showSearch={true} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-[#111318] dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              검색 결과로 돌아가기
            </button>
            {address && (
              <h1 className="text-xl font-bold text-[#111318] dark:text-white">
                {decodeURIComponent(address)}
              </h1>
            )}
          </div>
          <div className="bg-white dark:bg-[#151c2b] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <KakaoRoadView
              latitude={lat}
              longitude={lng}
              width="100%"
              height="600px"
              className="w-full"
            />
          </div>
        </main>
      </div>
    </>
  )
}

export default function RoadviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
          <Header showSearch={true} />
          <main className="flex justify-center items-center min-h-[calc(100vh-73px)]">
            <span className="loading loading-spinner loading-lg"></span>
          </main>
        </div>
      }
    >
      <RoadviewContent />
    </Suspense>
  )
}

