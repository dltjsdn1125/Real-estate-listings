'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/common/Header'

export default function Home() {
  const router = useRouter()

  // 자동 리다이렉트를 원하지 않을 경우 아래 주석 처리
  // useEffect(() => {
  //   router.push('/map')
  // }, [router])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Sharp and Clear */}
      <div className="fixed inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=100&w=2400&auto=format&fit=crop"
          alt="Bright Modern Office Interior"
          fill
          className="object-cover"
          priority
          unoptimized
        />
        {/* Very Subtle Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-slate-50/10 dark:from-slate-900/20 dark:via-transparent dark:to-slate-900/20"></div>
      </div>

      {/* Header with Glassmorphism */}
      <div className="relative z-10">
        <Header showSearch={false} showLogin={true} glassmorphism={true} />
      </div>

      <main className="relative z-10 flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 md:p-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Section with Glass Effect */}
          <div className="backdrop-blur-xl bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 md:p-8 mb-6 shadow-2xl">
            <div className="size-16 md:size-20 mx-auto mb-6 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <span className="material-symbols-outlined text-4xl md:text-5xl text-white drop-shadow-lg">real_estate_agent</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Daegu Commercial Platform
            </h1>
            <p className="text-base md:text-lg text-white mb-6 font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
              대구 지역 상가 중개업무 효율화를 위한 지도 기반 매물 관리 플랫폼
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/map"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-base font-bold rounded-xl border border-primary hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">map</span>
                지도로 매물 탐색하기
              </Link>
              <Link
                href="/auth/signup"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/40 backdrop-blur-md text-white text-base font-bold rounded-xl border border-white/60 hover:bg-white/60 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">person_add</span>
                회원가입
              </Link>
            </div>
          </div>

          {/* Feature Cards with Glass Effect */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="group backdrop-blur-xl bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-white/10 rounded-xl p-5 shadow-xl hover:shadow-2xl hover:bg-white/25 dark:hover:bg-slate-900/25 hover:scale-105 transition-all duration-300">
              <h3 className="text-lg font-bold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">지도 기반 탐색</h3>
              <p className="text-white text-sm leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                대구 지역의 상가 매물을 지도에서 직관적으로 탐색할 수 있습니다.
              </p>
            </div>
            <div className="group backdrop-blur-xl bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-white/10 rounded-xl p-5 shadow-xl hover:shadow-2xl hover:bg-white/25 dark:hover:bg-slate-900/25 hover:scale-105 transition-all duration-300">
              <h3 className="text-lg font-bold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">등급별 정보</h3>
              <p className="text-white text-sm leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                회원 등급에 따라 상세 정보 접근 권한이 차등 제공됩니다.
              </p>
            </div>
            <div className="group backdrop-blur-xl bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-white/10 rounded-xl p-5 shadow-xl hover:shadow-2xl hover:bg-white/25 dark:hover:bg-slate-900/25 hover:scale-105 transition-all duration-300">
              <h3 className="text-lg font-bold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">효율적 관리</h3>
              <p className="text-white text-sm leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                중개사와 관리자를 위한 체계적인 매물 및 사용자 관리 시스템.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

