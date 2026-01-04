'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'

export default function AdminContactInfoPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    company_name: '',
    full_name: '',
  })

  // 권한 체크
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        window.location.href = '/auth/login'
        return
      }
      if (user && !['admin', 'agent'].includes(user.role)) {
        window.location.href = '/'
        return
      }
    }
  }, [authLoading, isAuthenticated, user])

  // 사용자 정보 로드 (클라이언트 사이드에서만 실행)
  useEffect(() => {
    if (user && isAuthenticated && !loading) {
      setFormData((prev) => {
        // 이미 값이 있으면 업데이트하지 않음 (hydration 방지)
        if (prev.full_name && prev.phone) {
          return prev
        }
        return {
          phone: user.phone || '',
          company_name: user.company_name || '',
          full_name: user.full_name || '',
        }
      })
    }
  }, [user, isAuthenticated, loading])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!user) throw new Error('로그인이 필요합니다.')

      // Supabase 클라이언트를 사용하여 사용자 정보 업데이트
      const { error } = await supabase
        .from('users')
        .update({
          phone: formData.phone || null,
          company_name: formData.company_name || null,
          full_name: formData.full_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      alert('관리자 정보가 저장되었습니다.')
      router.push('/map')
    } catch (error: any) {
      console.error('Error saving contact info:', error)
      alert('정보 저장 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setSaving(false)
    }
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Admin', href: '/admin' },
    { label: '관리자 정보 입력' },
  ]

  // 클라이언트 사이드에서만 렌더링 (hydration 오류 방지)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <AdminHeader />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-[#616f89] dark:text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="mt-8">
          <h1 className="text-3xl font-bold text-[#111318] dark:text-white mb-6">관리자 정보 입력</h1>
          
          <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#dbdfe6] dark:border-gray-800 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  placeholder="이름을 입력하세요"
                  className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                  회사명
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="회사명을 입력하세요"
                  className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 px-4"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="010-1234-5678"
                  className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 px-4"
                />
                <p className="text-xs text-gray-500">모바일에서 연락처 및 메시지 기능에 사용됩니다.</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#f0f2f4] dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => router.push('/map')}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-[#111318] dark:text-gray-300 font-bold text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      저장하기
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 미리보기 */}
          {formData.full_name && formData.phone && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-[#111318] dark:text-white mb-4">미리보기</h2>
              <AdminContactCard
                fullName={formData.full_name}
                companyName={formData.company_name}
                phone={formData.phone}
                email={user?.email || ''}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 관리자 연락처 카드 컴포넌트
function AdminContactCard({
  fullName,
  companyName,
  phone,
  email,
}: {
  fullName: string
  companyName?: string
  phone: string
  email: string
}) {
  // 모바일에서 전화 연결 (통화는 아님)
  const handleCall = () => {
    if (phone) {
      window.location.href = `tel:${phone.replace(/[^0-9]/g, '')}`
    }
  }

  // 모바일에서 메시지 보내기
  const handleMessage = () => {
    if (phone) {
      window.location.href = `sms:${phone.replace(/[^0-9]/g, '')}`
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#dbdfe6] dark:border-gray-800 shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs font-bold px-2 py-1 rounded uppercase">
          Available
        </span>
        <div className="flex gap-2">
          <button className="transition-colors text-gray-400 hover:text-red-500">
            <span className="material-symbols-outlined">favorite_border</span>
          </button>
          <button className="text-gray-400 hover:text-blue-500 transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>
      <div>
        <p className="text-sm text-[#616f89] font-medium mb-1">Deposit / Monthly Rent</p>
        <div className="flex items-baseline gap-1 text-[#111318] dark:text-white">
          <span className="text-3xl font-black tracking-tight text-primary">0</span>
          <span className="text-xl font-bold">/</span>
          <span className="text-3xl font-black tracking-tight text-primary">0</span>
          <span className="text-lg font-bold ml-1">KRW</span>
        </div>
        <p className="text-xs text-[#616f89] mt-2">+ VAT Excluded</p>
      </div>
      <hr className="border-[#f0f2f4] dark:border-gray-800" />
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-500">person</span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#111318] dark:text-white">{fullName}</p>
          <p className="text-xs text-[#616f89]">{companyName || 'N/A'}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={handleCall}
          className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <span className="material-symbols-outlined text-[20px]">call</span>
          Contact Agent
        </button>
        <button
          onClick={handleMessage}
          className="w-full h-12 bg-white dark:bg-gray-800 border border-[#dbdfe6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[#111318] dark:text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
          Send Message
        </button>
      </div>
    </div>
  )
}

