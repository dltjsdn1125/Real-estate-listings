'use client'

import { useState } from 'react'
import { FilterState } from './PropertySearchSidebar'

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApply: () => void
  onReset: () => void
  onDistrictChange?: (district: string) => void
}

export default function FilterSidebar({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  onDistrictChange,
}: FilterSidebarProps) {
  const [showDistrictFilter, setShowDistrictFilter] = useState(false)
  const [showTypeFilter, setShowTypeFilter] = useState(false)
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const [showAreaFilter, setShowAreaFilter] = useState(false)

  const districts = [
    'all',
    '중구',
    '동구',
    '서구',
    '남구',
    '북구',
    '수성구',
    '달서구',
    '달성군',
  ]

  const propertyTypes = [
    { value: 'all', label: '전체' },
    { value: '상가', label: '상가' },
    { value: '사무실', label: '사무실' },
    { value: '건물', label: '건물' },
  ]

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
        className={`fixed lg:relative inset-y-0 left-0 w-80 bg-white dark:bg-[#111318] shadow-xl lg:shadow-none z-40 transition-transform duration-300 border-r border-gray-200 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111318] dark:text-white">필터</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-[#616f89] dark:text-gray-400 hover:text-[#111318] dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-120px)]">
          {/* 지역 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
              지역
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDistrictFilter(!showDistrictFilter)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-[#111318] dark:text-white">
                  {filters.district === 'all' ? '전체 지역' : filters.district}
                </span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {showDistrictFilter && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                  {districts.map((district) => (
                    <button
                      key={district}
                      onClick={() => {
                        onFiltersChange({ ...filters, district })
                        setShowDistrictFilter(false)
                        onDistrictChange?.(district)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                    >
                      {district === 'all' ? '전체' : district}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 매물 유형 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
              매물 유형
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTypeFilter(!showTypeFilter)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-[#111318] dark:text-white">
                  {propertyTypes.find((t) => t.value === filters.propertyType)?.label || '전체'}
                </span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {showTypeFilter && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        onFiltersChange({ ...filters, propertyType: type.value })
                        setShowTypeFilter(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 가격 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
              가격
            </label>
            <div className="relative">
              <button
                onClick={() => setShowPriceFilter(!showPriceFilter)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-[#111318] dark:text-white">
                  {filters.minDeposit || filters.maxDeposit || filters.minRent || filters.maxRent
                    ? '가격 설정됨'
                    : '전체 가격'}
                </span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {showPriceFilter && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">보증금 (만원)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="최소"
                          value={filters.minDeposit}
                          onChange={(e) =>
                            onFiltersChange({ ...filters, minDeposit: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="최대"
                          value={filters.maxDeposit}
                          onChange={(e) =>
                            onFiltersChange({ ...filters, maxDeposit: e.target.value })
                          }
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">월세 (만원)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="최소"
                          value={filters.minRent}
                          onChange={(e) => onFiltersChange({ ...filters, minRent: e.target.value })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="최대"
                          value={filters.maxRent}
                          onChange={(e) => onFiltersChange({ ...filters, maxRent: e.target.value })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPriceFilter(false)}
                      className="w-full py-2 bg-primary text-white rounded text-sm font-medium"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 면적 필터 */}
          <div>
            <label className="block text-sm font-medium text-[#111318] dark:text-white mb-2">
              면적
            </label>
            <div className="relative">
              <button
                onClick={() => setShowAreaFilter(!showAreaFilter)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-sm text-[#111318] dark:text-white">
                  {filters.minArea || filters.maxArea ? '면적 설정됨' : '전체 면적'}
                </span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {showAreaFilter && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">면적 (평)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="최소"
                          value={filters.minArea}
                          onChange={(e) => onFiltersChange({ ...filters, minArea: e.target.value })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="최대"
                          value={filters.maxArea}
                          onChange={(e) => onFiltersChange({ ...filters, maxArea: e.target.value })}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="parking"
                        checked={filters.hasParking}
                        onChange={(e) =>
                          onFiltersChange({ ...filters, hasParking: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <label htmlFor="parking" className="text-sm">
                        주차 가능만 보기
                      </label>
                    </div>
                    <button
                      onClick={() => setShowAreaFilter(false)}
                      className="w-full py-2 bg-primary text-white rounded text-sm font-medium"
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111318]">
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex-1 px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-[#111318] dark:text-white rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={onApply}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

