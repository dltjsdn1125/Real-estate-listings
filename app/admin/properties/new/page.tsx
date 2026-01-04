'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { createProperty, addPropertyImages, addPropertyTags } from '@/lib/supabase/properties'
import { uploadPropertyImages } from '@/lib/supabase/storage'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import type { PropertyType, TransactionType } from '@/lib/supabase/types'
import { addressToCoordinates, waitForKakaoMaps, normalizeAddress } from '@/lib/utils/geocoding'
import Script from 'next/script'

const DAEGU_DISTRICTS = ['중구', '수성구', '달서구', '북구', '동구', '서구', '남구', '달성군']

export default function NewPropertyPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // 권한 체크 - window.location.href 사용으로 전체 페이지 리로드
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
  const [kakaoLoaded, setKakaoLoaded] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [formData, setFormData] = useState({
    // 기본 정보
    property_type: '' as PropertyType | '',
    transaction_type: 'rent_monthly' as TransactionType,
    title: '',
    // 위치 정보
    district: '',
    dong: '',
    address: '',
    detail_address: '',
    hide_detail_address: false,
    latitude: null as number | null,
    longitude: null as number | null,
    // 금액 정보
    deposit: '',
    monthly_rent: '',
    yearly_rent: '',
    sale_price: '',
    key_money: '',
    maintenance_fee: '',
    vat_excluded: false,
    // 매물 상세
    exclusive_area: '',
    contract_area: '',
    floor_current: '',
    floor_total: '',
    approval_date: '',
    has_elevator: false,
    has_parking: false,
    immediate_move_in: false,
    // 관리자 설정
    is_public: true,
    is_premium: false,
    is_blurred: false,
    admin_notes: '',
    // 태그
    tags: [] as string[],
    // 업종 가능 여부
    allowed_business_types: [] as string[],
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null)

  // Kakao Maps API 로드
  useEffect(() => {
    waitForKakaoMaps().then(setKakaoLoaded)
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // 주소 자동 변환
  const handleAddressToCoordinates = async () => {
    if (!formData.address) {
      alert('주소를 입력해주세요.')
      return
    }

    if (!kakaoLoaded) {
      alert('지도 API가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setGeocoding(true)

    try {
      const fullAddress = normalizeAddress(
        `${formData.district} ${formData.dong} ${formData.address}`.trim()
      )
      const coords = await addressToCoordinates(fullAddress)

      if (coords) {
        setFormData((prev) => ({
          ...prev,
          latitude: coords.lat,
          longitude: coords.lng,
        }))
        alert('좌표 변환 완료!')
      } else {
        alert('주소를 찾을 수 없습니다. 주소를 확인해주세요.')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      alert('좌표 변환 중 오류가 발생했습니다.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newImages = [...images, ...files]
    setImages(newImages)

    // 미리보기 생성
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])

    // 첫 번째 이미지를 대표 이미지로 설정
    if (mainImageIndex === null && newImages.length > 0) {
      setMainImageIndex(0)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)

    if (mainImageIndex === index) {
      setMainImageIndex(newImages.length > 0 ? 0 : null)
    } else if (mainImageIndex !== null && mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1)
    }
  }

  const handleSetMainImage = (index: number) => {
    setMainImageIndex(index)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 현재 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // 매물 데이터 준비
      const propertyData = {
        title: formData.title,
        description: null,
        property_type: formData.property_type as PropertyType,
        transaction_type: formData.transaction_type,
        district: formData.district,
        dong: formData.dong || null,
        address: formData.address,
        detail_address: formData.detail_address || null,
        hide_detail_address: formData.hide_detail_address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
        yearly_rent: formData.yearly_rent ? parseFloat(formData.yearly_rent) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        key_money: formData.key_money ? parseFloat(formData.key_money) : null,
        maintenance_fee: formData.maintenance_fee ? parseFloat(formData.maintenance_fee) : null,
        vat_excluded: formData.vat_excluded,
        exclusive_area: formData.exclusive_area ? parseFloat(formData.exclusive_area) : null,
        contract_area: formData.contract_area ? parseFloat(formData.contract_area) : null,
        floor_current: formData.floor_current ? parseInt(formData.floor_current) : null,
        floor_total: formData.floor_total ? parseInt(formData.floor_total) : null,
        approval_date: formData.approval_date || null,
        has_elevator: formData.has_elevator,
        has_parking: formData.has_parking,
        immediate_move_in: formData.immediate_move_in,
        is_public: formData.is_public,
        is_premium: formData.is_premium,
        is_blurred: formData.is_blurred,
        admin_notes: formData.admin_notes || null,
        created_by: user.id,
        agent_id: null,
        status: 'available' as const,
      }

      // 매물 생성
      const property = await createProperty(propertyData)

      // 이미지 업로드 및 저장
      if (images.length > 0) {
        const imageUrls = await uploadPropertyImages(images, property.id)
        const imageData = imageUrls.map((url, index) => ({
          property_id: property.id,
          image_url: url,
          image_alt: `Property image ${index + 1}`,
          is_main: index === mainImageIndex,
          display_order: index,
        }))
        await addPropertyImages(imageData)
      }

      // 태그 저장
      if (formData.tags.length > 0) {
        const tagData = formData.tags.map((tag) => ({
          property_id: property.id,
          tag: tag.trim(),
        }))
        await addPropertyTags(tagData)
      }

      router.push(`/admin/properties/${property.id}`)
    } catch (error) {
      console.error('Error creating property:', error)
      alert('매물 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const breadcrumbs = [
    { label: '홈', href: '/' },
    { label: '매물 관리', href: '/admin/properties' },
    { label: '매물 등록' },
  ]

  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        strategy="lazyOnload"
        onLoad={() => {
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              setKakaoLoaded(true)
            })
          }
        }}
      />
      <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark">
      <AdminHeader />
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-[#f0f2f4] bg-white dark:bg-[#1e293b] dark:border-[#334155] px-6 shrink-0 z-20">
          {/* Left Side: Logo & Title */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-8 text-primary">
                <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#111318] dark:text-white hidden sm:block">Daegu Admin</h2>
            </Link>
          </div>

          {/* Right Side: User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-slate-700">
                <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                <span className="text-sm font-medium text-[#111318] dark:text-white">{user.full_name || user.email}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary">{user.tier}</span>
              </div>
            )}
            {/* Logout Button */}
            <button
              onClick={async () => {
                const { supabase } = await import('@/lib/supabase/client')
                await supabase.auth.signOut()
                window.location.href = '/'
              }}
              className="flex h-10 px-4 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors bg-[#f0f2f4] dark:bg-slate-700 text-[#111318] dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </header>
        <div className="flex-1 px-4 sm:px-8 lg:px-12 py-8 overflow-y-auto">
          <div className="max-w-[1000px] mx-auto flex flex-col gap-6">
            <Breadcrumbs items={breadcrumbs} />
            {/* Page Heading */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-4 border-b border-[#e5e7eb] dark:border-gray-800">
              <div className="flex flex-col gap-2">
                <h1 className="text-[#111318] dark:text-white text-3xl font-extrabold leading-tight tracking-tight">
                  신규 매물 등록
                </h1>
                <p className="text-[#616f89] dark:text-gray-400 text-base">
                  새로운 상가 매물의 정보를 입력하고 등록합니다. * 표시는 필수 입력 항목입니다.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-[#111318] dark:text-gray-300 font-bold text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  임시저장
                </button>
                <button
                  type="submit"
                  form="property-form"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {loading ? '등록 중...' : '매물 등록하기'}
                </button>
              </div>
            </div>
            {/* Form Section */}
            <form id="property-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* 1. Basic Information */}
              <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs">
                      1
                    </span>
                    기본 정보
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                      매물 분류 <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11"
                    >
                      <option disabled value="">
                        선택해주세요
                      </option>
                      <option value="store">일반 상가</option>
                      <option value="office">사무실</option>
                      <option value="building">상가 건물</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                      거래 유형 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 h-11 items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="transaction_type"
                          value="rent_monthly"
                          checked={formData.transaction_type === 'rent_monthly'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-[#111318] dark:text-gray-300">임대 (월세)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="transaction_type"
                          value="rent_yearly"
                          checked={formData.transaction_type === 'rent_yearly'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-[#111318] dark:text-gray-300">임대 (전세)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="transaction_type"
                          value="sale"
                          checked={formData.transaction_type === 'sale'}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <span className="text-sm text-[#111318] dark:text-gray-300">매매</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                      매물 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      maxLength={40}
                      placeholder="예: 동성로 메인 상권 1층 무권리 상가 (최대 40자)"
                      className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 placeholder:text-xs placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Location */}
              <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs">
                      2
                    </span>
                    위치 정보
                  </h3>
                </div>
                <div className="p-6 flex flex-col lg:flex-row gap-6">
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        지역 선택 (대구광역시) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          required
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11"
                        >
                          <option value="">구 선택</option>
                          {DAEGU_DISTRICTS.map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          name="dong"
                          value={formData.dong}
                          onChange={handleInputChange}
                          placeholder="동/가 입력"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 placeholder:text-xs placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        상세 주소 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          placeholder="도로명 또는 지번 주소 검색"
                          className="flex-1 rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 placeholder:text-xs placeholder:text-gray-400"
                        />
                        <button
                          type="button"
                          className="px-4 rounded-lg bg-[#f0f2f4] dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-[#111318] dark:text-white font-medium text-sm transition-colors whitespace-nowrap"
                        >
                          주소 검색
                        </button>
                      </div>
                      <input
                        type="text"
                        name="detail_address"
                        value={formData.detail_address}
                        onChange={handleInputChange}
                        placeholder="상세 주소 (층, 호수 등) - 비공개 시 '비공개' 입력"
                        className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 mt-1 placeholder:text-xs placeholder:text-gray-400"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="hideAddress"
                        name="hide_detail_address"
                        checked={formData.hide_detail_address}
                        onChange={handleInputChange}
                        className="rounded text-primary focus:ring-primary border-gray-300 w-4 h-4"
                      />
                      <label
                        htmlFor="hideAddress"
                        className="text-sm text-[#616f89] dark:text-gray-400"
                      >
                        일반 사용자에게 상세 주소 노출 안함 (동까지만 노출)
                      </label>
                    </div>
                  </div>
                  <div className="w-full lg:w-[350px] flex flex-col gap-4">
                    <div className="h-[200px] rounded-lg overflow-hidden relative bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                          <span className="material-symbols-outlined text-red-500">location_on</span>
                          <span className="text-xs font-medium dark:text-white">
                            {formData.latitude && formData.longitude
                              ? `좌표: ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                              : '지도 미리보기'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddressToCoordinates}
                      disabled={geocoding || !formData.address}
                      className="w-full py-3 px-4 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {geocoding ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          변환 중...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">
                            location_on
                          </span>
                          주소 → 좌표 자동 변환
                        </>
                      )}
                    </button>
                    <p className="text-xs text-[#616f89] dark:text-gray-400 text-center">
                      * 주소를 입력한 후 버튼을 클릭하면 자동으로 좌표가 입력됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Financials & Specs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Financials */}
                <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs">
                        3
                      </span>
                      금액 정보
                    </h3>
                    <span className="text-xs text-gray-500">(단위: 만원)</span>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        보증금
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="deposit"
                          value={formData.deposit}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 pr-12 text-right placeholder:text-xs placeholder:text-gray-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          만원
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        월세
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="monthly_rent"
                          value={formData.monthly_rent}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 pr-12 text-right placeholder:text-xs placeholder:text-gray-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          만원
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        권리금
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="key_money"
                          value={formData.key_money}
                          onChange={handleInputChange}
                          placeholder="없음"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 pr-12 text-right placeholder:text-xs placeholder:text-gray-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          만원
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        관리비
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="maintenance_fee"
                          value={formData.maintenance_fee}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 pr-12 text-right placeholder:text-xs placeholder:text-gray-400"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          만원
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 pt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="vat"
                          name="vat_excluded"
                          checked={formData.vat_excluded}
                          onChange={handleInputChange}
                          className="rounded text-primary focus:ring-primary border-gray-300 w-4 h-4"
                        />
                        <label htmlFor="vat" className="text-sm text-[#616f89] dark:text-gray-400">
                          부가세 별도
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Specs */}
                <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden h-full">
                  <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                      <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs">
                        4
                      </span>
                      매물 상세
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        전용 면적
                      </label>
                      <div className="relative flex">
                        <input
                          type="number"
                          name="exclusive_area"
                          value={formData.exclusive_area}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full rounded-l-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 pr-12 text-right"
                        />
                        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-3 rounded-r-lg border-y border-r border-[#d1d5db] dark:border-gray-700 text-sm text-gray-500">
                          평
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        공급 면적
                      </label>
                      <div className="relative flex">
                        <input
                          type="number"
                          name="contract_area"
                          value={formData.contract_area}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full rounded-l-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 pr-12 text-right"
                        />
                        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 px-3 rounded-r-lg border-y border-r border-[#d1d5db] dark:border-gray-700 text-sm text-gray-500">
                          평
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        해당 층 / 총 층
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="floor_current"
                          value={formData.floor_current}
                          onChange={handleInputChange}
                          placeholder="1"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 text-center placeholder:text-xs placeholder:text-gray-400"
                        />
                        <span className="text-gray-400">/</span>
                        <input
                          type="text"
                          name="floor_total"
                          value={formData.floor_total}
                          onChange={handleInputChange}
                          placeholder="5"
                          className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11 text-center placeholder:text-xs placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                        사용 승인일
                      </label>
                      <input
                        type="date"
                        name="approval_date"
                        value={formData.approval_date}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary h-11"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4 pt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="has_elevator"
                          checked={formData.has_elevator}
                          onChange={handleInputChange}
                          className="rounded text-primary focus:ring-primary border-gray-300 w-4 h-4"
                        />
                        <span className="text-sm text-[#111318] dark:text-gray-300">엘리베이터</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="has_parking"
                          checked={formData.has_parking}
                          onChange={handleInputChange}
                          className="rounded text-primary focus:ring-primary border-gray-300 w-4 h-4"
                        />
                        <span className="text-sm text-[#111318] dark:text-gray-300">주차 가능</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="immediate_move_in"
                          checked={formData.immediate_move_in}
                          onChange={handleInputChange}
                          className="rounded text-primary focus:ring-primary border-gray-300 w-4 h-4"
                        />
                        <span className="text-sm text-[#111318] dark:text-gray-300">즉시 입주</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* 업종 가능 여부 */}
                  <div className="flex flex-col gap-3 md:col-span-2 mb-4">
                    <label className="text-sm font-semibold text-[#111318] dark:text-gray-300 pl-1">
                      가능 업종 (선택)
                    </label>
                    <div className="ml-1 sm:ml-2 mr-1 sm:mr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-2.5 sm:gap-y-3 px-6 sm:px-8 py-3 sm:py-4 mb-4 rounded-lg bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
                      {['음식점', '카페', '소매업', '서비스업', '학원', '병원', '사무실', '기타'].map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0">
                          <input
                            type="checkbox"
                            checked={formData.allowed_business_types.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  allowed_business_types: [...prev.allowed_business_types, type]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  allowed_business_types: prev.allowed_business_types.filter(t => t !== type)
                                }))
                              }
                            }}
                            className="rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-600 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <span className="text-sm text-[#111318] dark:text-gray-300 select-none truncate">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Media Upload */}
              <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs">
                      5
                    </span>
                    사진 등록
                  </h3>
                  <span className="text-xs text-gray-500">최대 20장</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={images.length >= 20}
                    />
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-primary">
                        cloud_upload
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-[#111318] dark:text-white">
                        사진을 드래그하거나 클릭하여 업로드
                      </p>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG 파일 (장당 최대 10MB)</p>
                    </div>
                  </label>
                  {/* Photo Grid */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className={`relative aspect-square rounded-lg overflow-hidden border group ${
                            mainImageIndex === index
                              ? 'border-primary ring-2 ring-primary ring-offset-2 dark:ring-offset-[#111318]'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {mainImageIndex === index && (
                            <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                              대표 사진
                            </div>
                          )}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview}
                            alt={`Property image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(index)}
                              className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                            >
                              <span className="material-symbols-outlined text-sm">star</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-sm"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                          {mainImageIndex !== index && (
                            <div className="absolute bottom-0 w-full bg-black/50 p-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(index)}
                                className="text-xs text-white hover:underline"
                              >
                                대표로 설정
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Management Settings */}
              <div className="bg-white dark:bg-[#111318] rounded-xl border border-[#e5e7eb] dark:border-gray-800 shadow-sm overflow-hidden mb-20">
                <div className="px-6 py-4 border-b border-[#e5e7eb] dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <h3 className="text-lg font-bold text-[#111318] dark:text-white flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 rounded-full bg-primary/10 text-primary text-xs">
                      6
                    </span>
                    관리자 설정
                  </h3>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#111318] dark:text-gray-300">
                      관리자 메모 (비공개)
                    </label>
                    <textarea
                      name="admin_notes"
                      value={formData.admin_notes}
                      onChange={handleInputChange}
                      placeholder="내부 관리용 메모를 입력하세요 (임대인 연락처, 특이사항 등)"
                      rows={3}
                      className="w-full rounded-lg border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-gray-200 focus:border-primary focus:ring-primary p-3 resize-none placeholder:text-xs placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3 p-4 rounded-lg bg-background-light dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111318] dark:text-white">
                            공개 상태 설정
                          </span>
                          <span className="text-xs text-gray-500">매물 노출 여부를 결정합니다.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_public"
                            checked={formData.is_public}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4 rounded-lg bg-background-light dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111318] dark:text-white">VIP 전용 매물</span>
                          <span className="text-xs text-gray-500">
                            일반 회원에게는 블러 처리되어 보입니다.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_premium"
                            checked={formData.is_premium}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4 rounded-lg bg-background-light dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#111318] dark:text-white">블러 처리</span>
                          <span className="text-xs text-gray-500">
                            매물 정보를 블러 처리하여 표시합니다.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_blurred"
                            checked={formData.is_blurred}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
    </>
  )
}

