'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import PropertyCard from './PropertyCard'
import QuickPropertyRegisterModal from './QuickPropertyRegisterModal'
import FavoritePropertyModal from './FavoritePropertyModal'
import { addFavorite, removeFavorite } from '@/lib/supabase/favorites'

interface Property {
  id: string
  title: string
  location: string
  deposit: string
  rent: string
  area: string
  parking?: boolean
  type: 'standard' | 'premium'
  imageUrl: string
  imageAlt: string
  isNew?: boolean
  propertyType?: string
  isLocked?: boolean
}

interface PropertyManagementSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeTab: 'my-properties' | 'favorites' | 'register'
  onTabChange: (tab: 'my-properties' | 'favorites' | 'register') => void
  onPropertyClick?: (id: string) => void
}

export default function PropertyManagementSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onPropertyClick,
}: PropertyManagementSidebarProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [myProperties, setMyProperties] = useState<Property[]>([])
  const [favorites, setFavorites] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false)
  const [selectedKeyword, setSelectedKeyword] = useState<string>('')

  // 내가 등록한 매물 로드
  const loadMyProperties = async () => {
    if (!isAuthenticated || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images(*)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formatted: Property[] = data.map((p: any) => ({
          id: p.id,
          title: p.title,
          location: `${p.district}${p.dong ? ', ' + p.dong : ''}`,
          deposit: p.deposit ? `${(p.deposit / 10000).toLocaleString()}만` : '0',
          rent: p.monthly_rent ? `${(p.monthly_rent / 10000).toLocaleString()}만` : '0',
          area: p.exclusive_area ? `${p.exclusive_area}평` : 'N/A',
          parking: p.has_parking,
          type: (p.is_premium ? 'premium' : 'standard') as 'premium' | 'standard',
          imageUrl: p.property_images?.[0]?.image_url || '',
          imageAlt: p.title,
          propertyType: p.property_type === 'store' ? '상가' : p.property_type === 'office' ? '사무실' : '건물',
        }))
        setMyProperties(formatted)
      }
    } catch (error) {
      console.error('내 매물 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 즐겨찾기 매물 로드
  const loadFavorites = async () => {
    if (!isAuthenticated || !user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          properties:property_id (
            *,
            property_images(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const formatted: Property[] = data
          .filter((f: any) => f.properties)
          .map((f: any) => {
            const p = f.properties
            return {
              id: p.id,
              title: p.title,
              location: `${p.district}${p.dong ? ', ' + p.dong : ''}`,
              deposit: p.deposit ? `${(p.deposit / 10000).toLocaleString()}만` : '0',
              rent: p.monthly_rent ? `${(p.monthly_rent / 10000).toLocaleString()}만` : '0',
              area: p.exclusive_area ? `${p.exclusive_area}평` : 'N/A',
              parking: p.has_parking,
              type: (p.is_premium ? 'premium' : 'standard') as 'premium' | 'standard',
              imageUrl: p.property_images?.[0]?.image_url || '',
              imageAlt: p.title,
              propertyType: p.property_type === 'store' ? '상가' : p.property_type === 'office' ? '사무실' : '건물',
            }
          })
        setFavorites(formatted)
      }
    } catch (error) {
      console.error('즐겨찾기 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      if (activeTab === 'my-properties') {
        loadMyProperties()
      } else if (activeTab === 'favorites') {
        loadFavorites()
      }
    }
  }, [isOpen, activeTab, isAuthenticated])

  const handleFavoriteClick = async (propertyId: string) => {
    if (!isAuthenticated || !user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const isFavorited = favorites.some((f) => f.id === propertyId)

      if (isFavorited) {
        await removeFavorite(user.id, propertyId)
      } else {
        await addFavorite(user.id, propertyId)
      }

      if (activeTab === 'favorites') {
        loadFavorites()
      }
    } catch (error) {
      console.error('즐겨찾기 오류:', error)
      alert('즐겨찾기 처리 중 오류가 발생했습니다.')
    }
  }

  const handleRegisterSuccess = () => {
    loadMyProperties()
    setRegisterModalOpen(false)
  }

  const currentProperties = activeTab === 'my-properties' ? myProperties : favorites

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-[#111318] shadow-xl lg:shadow-none z-40 transition-transform duration-300 border-l border-gray-200 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#111318] dark:text-white">매물 관리</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-[#616f89] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-[28px]">close</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange('my-properties')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'my-properties'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
              }`}
            >
              내 매물
            </button>
            <button
              onClick={() => onTabChange('favorites')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
              }`}
            >
              즐겨찾기
            </button>
            {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') && (
              <button
                onClick={() => {
                  onTabChange('register')
                  setRegisterModalOpen(true)
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'register'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-[#111318] dark:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-background-light dark:bg-[#0b0f17]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <h3 className="text-[#111318] dark:text-white tracking-tight text-lg font-bold leading-tight pb-4">
                {activeTab === 'my-properties' && `내 매물 ${currentProperties.length}개`}
                {activeTab === 'favorites' && `즐겨찾기 ${currentProperties.length}개`}
                {activeTab === 'register' && '매물 등록'}
              </h3>
              <div className="flex flex-col gap-4">
                {activeTab === 'register' ? (
                  <div className="text-center py-12 text-[#616f89] dark:text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-2 opacity-50">
                      add_circle
                    </span>
                    <p className="text-sm mb-4">매물을 등록하려면 버튼을 클릭하세요</p>
                    {isAuthenticated && (user?.role === 'admin' || user?.role === 'agent') ? (
                      <button
                        onClick={() => setRegisterModalOpen(true)}
                        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        매물 등록
                      </button>
                    ) : (
                      <p className="text-xs">매물 등록 권한이 없습니다.</p>
                    )}
                  </div>
                ) : (
                  <>
                    {currentProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        {...property}
                        onClick={() => onPropertyClick?.(property.id)}
                        onFavorite={handleFavoriteClick}
                      />
                    ))}
                    {currentProperties.length === 0 && (
                      <div className="text-center py-12 text-[#616f89] dark:text-gray-400">
                        <span className="material-symbols-outlined text-5xl mb-2 opacity-50">
                          {activeTab === 'my-properties' ? 'home' : 'favorite_border'}
                        </span>
                        <p className="text-sm">
                          {activeTab === 'my-properties'
                            ? '등록한 매물이 없습니다.'
                            : '즐겨찾기한 매물이 없습니다.'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <QuickPropertyRegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </>
  )
}

