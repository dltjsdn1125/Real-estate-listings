'use client'

import { useState, useEffect } from 'react'
import { createProperty } from '@/lib/supabase/properties'
import { useAuth } from '@/lib/hooks/useAuth'
import { addressToCoordinates, coordinatesToAddress, waitForKakaoMaps } from '@/lib/utils/geocoding'
import type { PropertyType, TransactionType } from '@/lib/supabase/types'

interface QuickPropertyRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
  initialTitle?: string
  initialAddress?: string
  onSuccess?: () => void
  onAddToFavorites?: (propertyId: string) => Promise<void>
}

const DAEGU_DISTRICTS = ['중구', '수성구', '달서구', '북구', '동구', '서구', '남구', '달성군']

export default function QuickPropertyRegisterModal({
  isOpen,
  onClose,
  initialLocation,
  initialTitle,
  initialAddress,
  onSuccess,
  onAddToFavorites,
}: QuickPropertyRegisterModalProps) {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [addressLoading, setAddressLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialTitle || '',
    property_type: '' as PropertyType | '',
    transaction_type: 'rent_monthly' as TransactionType,
    district: '',
    dong: '',
    address: initialAddress || '',
    latitude: initialLocation?.lat || null as number | null,
    longitude: initialLocation?.lng || null as number | null,
    deposit: '',
    monthly_rent: '',
    key_money: '',
    exclusive_area: '',
  })
  const [addToFavorites, setAddToFavorites] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)
  
  // 사용자 등급 확인 (bronze 이상이면 권리금 입력 가능)
  const canInputKeyMoney = user && user.tier && ['bronze', 'silver', 'gold', 'platinum', 'premium', 'agent', 'admin'].includes(user.tier)

  // 초기 위치가 변경되면 주소 자동 조회
  useEffect(() => {
    if (initialLocation && isOpen) {
      setFormData((prev) => ({
        ...prev,
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        title: initialTitle || prev.title,
        address: initialAddress || prev.address,
      }))
      // 주소가 없으면 좌표에서 가져오기
      if (!initialAddress) {
        loadAddressFromCoordinates(initialLocation.lat, initialLocation.lng)
      }
    }
  }, [initialLocation, isOpen, initialTitle, initialAddress])

  const loadAddressFromCoordinates = async (lat: number, lng: number) => {
    setAddressLoading(true)
    try {
      await waitForKakaoMaps()
      const address = await coordinatesToAddress(lat, lng)
      if (address) {
        // 주소에서 구 정보 추출
        const district = DAEGU_DISTRICTS.find((d) => address.includes(d)) || ''
        setFormData((prev) => ({
          ...prev,
          address,
          district,
        }))
      }
    } catch (error) {
      console.error('주소 조회 실패:', error)
    } finally {
      setAddressLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressChange = async (address: string) => {
    setFormData((prev) => ({ ...prev, address }))
    
    // 주소에서 구 정보 추출
    const district = DAEGU_DISTRICTS.find((d) => address.includes(d)) || ''
    setFormData((prev) => ({ ...prev, district }))

    // 주소를 좌표로 변환
    if (address.trim()) {
      setAddressLoading(true)
      try {
        await waitForKakaoMaps()
        const coords = await addressToCoordinates(address)
        if (coords) {
          setFormData((prev) => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng,
          }))
        }
      } catch (error) {
        console.error('좌표 변환 실패:', error)
      } finally {
        setAddressLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!['admin', 'agent'].includes(user.role)) {
      alert('매물 등록 권한이 없습니다.')
      return
    }

    if (!formData.title || !formData.property_type || !formData.address) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const propertyData = {
        title: formData.title,
        description: null,
        property_type: formData.property_type as PropertyType,
        transaction_type: formData.transaction_type,
        district: formData.district,
        dong: formData.dong || null,
        address: formData.address,
        detail_address: null,
        hide_detail_address: false,
        latitude: formData.latitude,
        longitude: formData.longitude,
        deposit: formData.deposit ? parseFloat(formData.deposit) * 10000 : null, // 만원 → 원
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) * 10000 : null,
        yearly_rent: null,
        sale_price: null,
        key_money: formData.key_money ? parseFloat(formData.key_money) * 10000 : null, // 만원 → 원
        maintenance_fee: null,
        vat_excluded: false,
        exclusive_area: formData.exclusive_area ? parseFloat(formData.exclusive_area) : null,
        contract_area: null,
        floor_current: null,
        floor_total: null,
        approval_date: null,
        has_elevator: false,
        has_parking: false,
        immediate_move_in: false,
        is_public: true,
        is_premium: false,
        is_blurred: isBlurred,
        admin_notes: null,
        created_by: user.id,
        agent_id: null,
        status: 'available' as const,
      }

      const createdProperty = await createProperty(propertyData)
      
      // 즐겨찾기에 추가
      if (addToFavorites && createdProperty?.id && onAddToFavorites) {
        try {
          await onAddToFavorites(createdProperty.id)
        } catch (error) {
          console.error('즐겨찾기 추가 실패:', error)
        }
      }
      
      alert('매물이 등록되었습니다.' + (addToFavorites ? ' 즐겨찾기에 추가되었습니다.' : ''))
      onSuccess?.()
      onClose()
      
      // 폼 초기화
      setFormData({
        title: '',
        property_type: '' as PropertyType | '',
        transaction_type: 'rent_monthly' as TransactionType,
        district: '',
        dong: '',
        address: '',
        latitude: null,
        longitude: null,
        deposit: '',
        monthly_rent: '',
        key_money: '',
        exclusive_area: '',
      })
      setAddToFavorites(false)
    } catch (error: any) {
      console.error('매물 등록 실패:', error)
      alert('매물 등록에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#111318] rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f2f4] dark:border-gray-800">
          <h2 className="text-xl font-bold text-[#111318] dark:text-white">간단 매물 등록</h2>
          <button
            onClick={onClose}
            className="text-[#616f89] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
              매물 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
              placeholder="예: 동성로 상가 1층"
            />
          </div>

          {/* 매물 유형 */}
          <div>
            <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
              매물 유형 <span className="text-red-500">*</span>
            </label>
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
            >
              <option value="">선택해주세요</option>
              <option value="store">상가</option>
              <option value="office">사무실</option>
              <option value="building">건물</option>
            </select>
          </div>

          {/* 거래 유형 */}
          <div>
            <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
              거래 유형 <span className="text-red-500">*</span>
            </label>
            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
            >
              <option value="rent_monthly">월세</option>
              <option value="rent_yearly">전세</option>
              <option value="sale">매매</option>
            </select>
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
              주소 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                required
                className="flex-1 rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="주소를 입력하거나 지도에서 선택하세요"
              />
              {addressLoading && (
                <div className="flex items-center px-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            {formData.district && (
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full mt-2 rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2"
              >
                <option value="">구 선택</option>
                {DAEGU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 보증금 */}
          <div>
            <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
              보증금 (만원)
            </label>
            <input
              type="number"
              name="deposit"
              value={formData.deposit}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
              placeholder="예: 5000"
            />
          </div>

          {/* 월세 */}
          {formData.transaction_type === 'rent_monthly' && (
            <div>
              <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                월세 (만원)
              </label>
              <input
                type="number"
                name="monthly_rent"
                value={formData.monthly_rent}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="예: 50"
              />
            </div>
          )}

          {/* 권리금 (일반 회원 이상) */}
          {canInputKeyMoney && (
            <div>
              <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                권리금 (만원)
              </label>
              <input
                type="number"
                name="key_money"
                value={formData.key_money}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="예: 1000"
              />
            </div>
          )}

          {/* 면적 */}
          <div>
            <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
              전용면적 (평)
            </label>
            <input
              type="number"
              name="exclusive_area"
              value={formData.exclusive_area}
              onChange={handleInputChange}
              step="0.1"
              className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
              placeholder="예: 10.5"
            />
          </div>

          {/* 블러 처리 옵션 (관리자/에이전트만) */}
          {(user?.role === 'admin' || user?.role === 'agent') && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBlurred"
                checked={isBlurred}
                onChange={(e) => setIsBlurred(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isBlurred" className="text-sm text-[#111318] dark:text-gray-300">
                블러 처리 (일반 사용자에게 정보 숨김)
              </label>
            </div>
          )}

          {/* 즐겨찾기 추가 옵션 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="addToFavorites"
              checked={addToFavorites}
              onChange={(e) => setAddToFavorites(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="addToFavorites" className="text-sm text-[#111318] dark:text-gray-300">
              등록 후 즐겨찾기에 추가
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

