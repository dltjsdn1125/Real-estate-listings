'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import { getPropertyById, updateProperty } from '@/lib/supabase/properties'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { addressToCoordinates, waitForKakaoMaps, coordinatesToAddress } from '@/lib/utils/geocoding'
import type { PropertyType, TransactionType } from '@/lib/supabase/types'

const DAEGU_DISTRICTS = ['중구', '수성구', '달서구', '북구', '동구', '서구', '남구', '달성군']

interface PageProps {
  params: { id: string }
}

export default function PropertyEditPage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<any>(null)
  const [addressLoading, setAddressLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    property_type: '' as PropertyType | '',
    transaction_type: 'rent_monthly' as TransactionType,
    district: '',
    dong: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    deposit: '',
    monthly_rent: '',
    yearly_rent: '',
    sale_price: '',
    key_money: '',
    exclusive_area: '',
    contract_area: '',
    floor_current: '',
    floor_total: '',
    maintenance_fee: '',
    has_parking: false,
    has_elevator: false,
  })

  // 사용자 등급 확인 (bronze 이상이면 권리금 입력 가능)
  const canInputKeyMoney = user && user.tier && ['bronze', 'silver', 'gold', 'platinum', 'premium', 'agent', 'admin'].includes(user.tier)

  useEffect(() => {
    // 인증 로딩 중이면 대기
    if (authLoading) return

    // 인증 완료 후 로그인 상태 확인
    if (isAuthenticated && user) {
      loadProperty()
    } else {
      // 인증되지 않은 경우에만 로그인 페이지로 이동
      router.push('/auth/login')
    }
  }, [id, isAuthenticated, user, authLoading])

  const loadProperty = async () => {
    try {
      setLoading(true)
      const { data, error } = await getPropertyById(id)

      if (error || !data) {
        console.error('Error loading property:', error)
        alert('매물 정보를 불러올 수 없습니다.')
        router.push('/map')
        return
      }

      // 권한 확인: 소유자 또는 admin/agent만 수정 가능
      if (data.created_by !== user?.id && !['admin', 'agent'].includes(user?.role || '')) {
        alert('수정 권한이 없습니다.')
        router.push(`/properties/${id}`)
        return
      }

      setProperty(data)

      // 폼 데이터 설정
      const formatAmount = (amount: number | null) => {
        if (!amount) return ''
        return (amount / 10000).toString()
      }

      setFormData({
        title: data.title || '',
        property_type: data.property_type || '',
        transaction_type: data.transaction_type || 'rent_monthly',
        district: data.district || '',
        dong: data.dong || '',
        address: data.address || '',
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        deposit: formatAmount(data.deposit),
        monthly_rent: formatAmount(data.monthly_rent),
        yearly_rent: formatAmount(data.yearly_rent),
        sale_price: formatAmount(data.sale_price),
        key_money: formatAmount(data.key_money),
        exclusive_area: data.exclusive_area ? data.exclusive_area.toString() : '',
        contract_area: data.contract_area ? data.contract_area.toString() : '',
        floor_current: data.floor_current ? data.floor_current.toString() : '',
        floor_total: data.floor_total ? data.floor_total.toString() : '',
        maintenance_fee: data.maintenance_fee ? data.maintenance_fee.toString() : '',
        has_parking: data.has_parking || false,
        has_elevator: data.has_elevator || false,
      })
    } catch (error) {
      console.error('Error loading property:', error)
      alert('매물 정보를 불러오는 중 오류가 발생했습니다.')
      router.push('/map')
    } finally {
      setLoading(false)
    }
  }

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

    if (!['admin', 'agent'].includes(user.role) && property?.created_by !== user.id) {
      alert('수정 권한이 없습니다.')
      return
    }

    if (!formData.title || !formData.property_type || !formData.address) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const updateData = {
        title: formData.title,
        property_type: formData.property_type as PropertyType,
        transaction_type: formData.transaction_type,
        district: formData.district,
        dong: formData.dong || null,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        deposit: formData.deposit ? parseFloat(formData.deposit) * 10000 : null,
        monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) * 10000 : null,
        yearly_rent: formData.yearly_rent ? parseFloat(formData.yearly_rent) * 10000 : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) * 10000 : null,
        key_money: formData.key_money && canInputKeyMoney ? parseFloat(formData.key_money) * 10000 : null,
        exclusive_area: formData.exclusive_area ? parseFloat(formData.exclusive_area) : null,
        contract_area: formData.contract_area ? parseFloat(formData.contract_area) : null,
        floor_current: formData.floor_current ? parseInt(formData.floor_current) : null,
        floor_total: formData.floor_total ? parseInt(formData.floor_total) : null,
        maintenance_fee: formData.maintenance_fee ? parseFloat(formData.maintenance_fee) : null,
        has_parking: formData.has_parking,
        has_elevator: formData.has_elevator,
      }

      const { error } = await updateProperty(id, updateData)
      
      if (error) {
        throw error
      }
      
      alert('매물 정보가 수정되었습니다.')
      router.push(`/properties/${id}`)
    } catch (error: any) {
      console.error('매물 수정 실패:', error)
      alert('매물 수정에 실패했습니다: ' + (error.message || '알 수 없는 오류'))
    } finally {
      setSaving(false)
    }
  }

  // 인증 로딩 중이거나 매물 로딩 중이면 로딩 UI 표시
  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header showSearch={true} />
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {authLoading ? '인증 확인 중...' : '매물 정보를 불러오는 중...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header showSearch={true} />
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">매물을 찾을 수 없습니다.</p>
            <button
              onClick={() => router.push('/map')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
            >
              지도로 돌아가기
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header showSearch={true} />
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        <Breadcrumbs
          items={[
            { label: '홈', href: '/' },
            { label: '지도', href: '/map' },
            { label: property.title, href: `/properties/${id}` },
            { label: '수정', href: '#' },
          ]}
        />

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-[#111318] dark:text-white mb-6">매물 수정</h1>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111318] rounded-xl shadow-lg p-6 space-y-4">
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
                  name="address"
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

            {/* 전세 */}
            {formData.transaction_type === 'rent_yearly' && (
              <div>
                <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                  전세금 (만원)
                </label>
                <input
                  type="number"
                  name="yearly_rent"
                  value={formData.yearly_rent}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                  placeholder="예: 50000"
                />
              </div>
            )}

            {/* 매매가 */}
            {formData.transaction_type === 'sale' && (
              <div>
                <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                  매매가 (만원)
                </label>
                <input
                  type="number"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                  placeholder="예: 50000"
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

            {/* 전용면적 */}
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

            {/* 계약면적 */}
            <div>
              <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                계약면적 (평)
              </label>
              <input
                type="number"
                name="contract_area"
                value={formData.contract_area}
                onChange={handleInputChange}
                step="0.1"
                className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="예: 12.0"
              />
            </div>

            {/* 현재 층 */}
            <div>
              <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                현재 층
              </label>
              <input
                type="number"
                name="floor_current"
                value={formData.floor_current}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="예: 1"
              />
            </div>

            {/* 전체 층 */}
            <div>
              <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                전체 층
              </label>
              <input
                type="number"
                name="floor_total"
                value={formData.floor_total}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="예: 5"
              />
            </div>

            {/* 관리비 */}
            <div>
              <label className="block text-sm font-semibold text-[#111318] dark:text-gray-300 mb-2">
                관리비 (원)
              </label>
              <input
                type="number"
                name="maintenance_fee"
                value={formData.maintenance_fee}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="예: 50000"
              />
            </div>

            {/* 주차 가능 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="has_parking"
                checked={formData.has_parking}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="text-sm text-[#111318] dark:text-gray-300">주차 가능</label>
            </div>

            {/* 엘리베이터 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="has_elevator"
                checked={formData.has_elevator}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label className="text-sm text-[#111318] dark:text-gray-300">엘리베이터 있음</label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/properties/${id}`)}
                className="flex-1 px-4 py-2 rounded-lg border border-[#d1d5db] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#111318] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}

