'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // 로그인하지 않은 사용자는 로그인 페이지로
        router.push('/auth/login')
        return
      }

      setUserEmail(user.email || '')

      // 승인 상태 확인
      const { data } = await supabase
        .from('users')
        .select('approval_status')
        .eq('id', user.id)
        .single()

      // 승인된 사용자는 맵 페이지로 리다이렉트
      if (data?.approval_status === 'approved') {
        router.push('/map')
      }
      // pending 또는 rejected 상태는 이 페이지에 머물러야 함
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#111318] rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="size-20 mx-auto mb-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-yellow-600 dark:text-yellow-500">
              hourglass_empty
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[#111318] dark:text-white mb-4">
            승인 대기 중
          </h1>

          {/* Message */}
          <p className="text-[#616f89] dark:text-gray-400 mb-6">
            회원가입이 완료되었습니다.
            <br />
            관리자의 승인이 완료되면 서비스를 이용하실 수 있습니다.
          </p>

          {/* User Email */}
          <div className="bg-[#f0f2f4] dark:bg-[#1c2333] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#616f89] dark:text-gray-400 mb-1">가입 이메일</p>
            <p className="text-[#111318] dark:text-white font-medium">{userEmail}</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5">info</span>
              <span>
                승인은 보통 1-2 영업일 내에 완료됩니다.
                <br />
                문의사항은 고객센터로 연락해주세요.
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 bg-[#f0f2f4] dark:bg-[#1c2333] text-[#111318] dark:text-white font-medium rounded-lg hover:bg-[#e1e4e8] dark:hover:bg-[#2a3547] transition-colors"
            >
              로그아웃
            </button>

            <Link
              href="/"
              className="block w-full py-3 px-4 text-primary hover:underline font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

