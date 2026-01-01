'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
    licenseNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setLoading(false)
      return
    }

    // 비밀번호 강도 체크
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    try {
      // Supabase Auth에 사용자 생성 (트리거가 자동으로 users 테이블에 추가)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            company_name: formData.companyName || null,
            license_number: formData.licenseNumber || null,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // 트리거가 users 테이블에 기본 정보를 자동으로 추가함
        // 추가 정보(회사명, 면허번호)를 업데이트
        if (formData.companyName || formData.licenseNumber) {
          // 잠시 대기 (트리거가 완료될 때까지)
          await new Promise((resolve) => setTimeout(resolve, 500))

          const { error: updateError } = await supabase
            .from('users')
            .update({
              company_name: formData.companyName || null,
              license_number: formData.licenseNumber || null,
            })
            .eq('id', authData.user.id)

          if (updateError) {
            console.warn('추가 정보 업데이트 실패:', updateError)
            // 업데이트 실패해도 회원가입은 성공으로 처리
          }
        }

        // 회원가입 성공
        alert('회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.')
        router.push('/auth/pending')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-[#111318] rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="size-16 mx-auto mb-4 text-primary">
              <svg
                className="w-full h-full"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#111318] dark:text-white mb-2">
              회원가입
            </h1>
            <p className="text-sm text-[#616f89] dark:text-gray-400">
              대구 상가 매물 플랫폼에 가입하세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  비밀번호 확인 *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="홍길동"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="010-1234-5678"
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  회사명 (선택)
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="회사명"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
                  중개사 면허번호 (선택)
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#f0f2f4] dark:bg-[#1c2333] border border-[#dce0e5] dark:border-[#374151] rounded-lg text-[#111318] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="면허번호"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#616f89] dark:text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                로그인
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-[#616f89] dark:text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

