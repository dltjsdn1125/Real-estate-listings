'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import Breadcrumbs from '@/components/common/Breadcrumbs'
import PropertyImageGallery from '@/components/property/PropertyImageGallery'
import PropertySummary from '@/components/property/PropertySummary'
import KeyMoneySection from '@/components/property/KeyMoneySection'
import PropertyLocationMap from '@/components/property/PropertyLocationMap'
import PropertySidebar from '@/components/property/PropertySidebar'
import { getPropertyById } from '@/lib/supabase/properties'
import { supabase } from '@/lib/supabase/client'

interface PageProps {
  params: { id: string }
}

export default function PropertyDetailPage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userTier, setUserTier] = useState<string>('bronze')

  useEffect(() => {
    loadProperty()
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setIsAuthenticated(true)
      const { data } = await supabase.from('users').select('tier').eq('id', user.id).single()
      if (data) {
        setUserTier(data.tier)
      }
    }
  }

  const loadProperty = async () => {
    try {
      setLoading(true)
      const { data, error } = await getPropertyById(id)

      if (error || !data) {
        console.error('Error loading property:', error)
        router.push('/map')
        return
      }

      // 데이터 포맷팅
      const images = data.property_images && data.property_images.length > 0
        ? data.property_images.map((img: any) => ({
            url: img.image_url || '',
            alt: img.caption || data.title,
          })).filter((img: any) => img.url) // 빈 이미지 제거
        : []

      const tags = data.property_tags?.map((tag: any) => `#${tag.tag}`) || []

      // 금액 포맷팅
      const formatAmount = (amount: number | null) => {
        if (!amount) return '0'
        const inManWon = amount / 10000
        return inManWon >= 10000
          ? `${(inManWon / 10000).toFixed(1)}억`
          : `${inManWon.toLocaleString()}만`
      }

      const deposit =
        data.transaction_type === 'sale'
          ? formatAmount(data.sale_price)
          : formatAmount(data.deposit)
      const rent =
        data.transaction_type === 'rent_monthly'
          ? formatAmount(data.monthly_rent)
          : data.transaction_type === 'rent_yearly'
          ? formatAmount(data.yearly_rent)
          : '0'

      // Summary 정보
      const summary = {
        floor: `${data.floor_current || '?'}F / ${data.floor_total || '?'}F`,
        contractArea: data.contract_area ? `${data.contract_area}평` : 'N/A',
        exclusiveArea: data.exclusive_area ? `${data.exclusive_area}평` : 'N/A',
        maintenance: data.maintenance_fee
          ? `${data.maintenance_fee.toLocaleString()} KRW`
          : 'N/A',
        parking: data.has_parking ? (data.parking_count ? `${data.parking_count}대` : '가능') : '불가',
        elevator: data.has_elevator ? '있음' : '없음',
        restroom: 'N/A', // DB에 별도 필드 없음
        moveIn: data.immediate_move_in ? '즉시 입주 가능' : '협의 가능',
      }

      // Agent 정보 (creator)
      const agentData = data.creator
        ? {
            name: data.creator.full_name || 'N/A',
            company: data.creator.company_name || 'N/A',
            imageUrl: data.creator.avatar_url || '',
            imageAlt: `${data.creator.full_name || 'Agent'} profile`,
          }
        : {
            name: 'N/A',
            company: 'N/A',
            imageUrl: '',
            imageAlt: 'Agent profile',
          }

      // Breadcrumbs
      const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Daegu', href: '/map' },
        { label: data.district, href: `/map?district=${data.district}` },
        { label: data.dong || '' },
      ]

      // KeyMoney (보증금 또는 매매가)
      const keyMoney =
        data.transaction_type === 'sale'
          ? `${formatAmount(data.sale_price)} (매매)`
          : `${formatAmount(data.deposit)} (보증금)`

      const formattedProperty = {
        id: data.id,
        title: data.title,
        tags,
        images,
        summary,
        keyMoney,
        description: data.description || '',
        deposit,
        rent,
        agent: agentData,
        breadcrumbs,
        status: data.status,
        lat: data.latitude ? Number(data.latitude) : null,
        lng: data.longitude ? Number(data.longitude) : null,
        address: data.address,
      }

      setProperty(formattedProperty)
    } catch (error) {
      console.error('Error loading property:', error)
      router.push('/map')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginClick = () => {
    // 로그인 페이지로 이동 (추후 구현)
    alert('로그인 기능은 추후 구현 예정입니다.')
  }

  const handleContact = () => {
    // 연락처 액션
    if (property?.agent?.name) {
      alert(`${property.agent.name}에게 연락합니다.`)
    }
  }

  const handleMessage = () => {
    // 메시지 액션
    if (property?.agent?.name) {
      alert(`${property.agent.name}에게 메시지를 보냅니다.`)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header showSearch={true} />
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">매물 정보를 불러오는 중...</p>
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
        <main className="flex-grow w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#111318] dark:text-white mb-4">
              매물을 찾을 수 없습니다
            </h2>
            <button
              onClick={() => router.push('/map')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              매물 목록으로 돌아가기
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
        <Breadcrumbs items={property.breadcrumbs} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Details (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#111318] dark:text-white leading-tight">
                {property.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {property.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#f0f2f4] dark:bg-gray-800 text-[#111318] dark:text-gray-200 rounded-lg text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            {/* Image Gallery */}
            <PropertyImageGallery images={property.images} />
            {/* Info Cards Section */}
            <PropertySummary {...property.summary} />
            {/* Restricted Content Block (Key Money) */}
            <KeyMoneySection keyMoney={property.keyMoney} />
            {/* Description Section */}
            <div className="flex flex-col gap-4 py-4">
              <h3 className="text-xl font-bold text-[#111318] dark:text-white">
                Agent&apos;s Description
              </h3>
              <div className="prose dark:prose-invert max-w-none text-[#111318] dark:text-gray-300 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {property.description}
              </div>
            </div>
            {/* Map Section */}
            <PropertyLocationMap
              address={property.address}
              lat={property.lat}
              lng={property.lng}
            />
          </div>
          {/* Right Column: Sticky Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <PropertySidebar
              status={property.status}
              deposit={property.deposit}
              rent={property.rent}
              agentName={property.agent.name}
              agentCompany={property.agent.company}
              agentImageUrl={property.agent.imageUrl}
              agentImageAlt={property.agent.imageAlt}
              onContact={handleContact}
              onMessage={handleMessage}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

