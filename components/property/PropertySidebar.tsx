'use client'

import Image from 'next/image'
import { useState } from 'react'

interface PropertySidebarProps {
  status?: 'available' | 'sold' | 'pending'
  deposit: string
  rent: string
  vatExcluded?: boolean
  agentName?: string
  agentCompany?: string
  agentImageUrl?: string
  agentImageAlt?: string
  onContact?: () => void
  onMessage?: () => void
}

export default function PropertySidebar({
  status = 'available',
  deposit,
  rent,
  vatExcluded = true,
  agentName,
  agentCompany,
  agentImageUrl,
  agentImageAlt,
  onContact,
  onMessage,
}: PropertySidebarProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  const statusConfig = {
    available: {
      label: 'Available',
      className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    sold: {
      label: 'Sold',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    pending: {
      label: 'Pending',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="flex flex-col gap-4">
      {/* Pricing Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-[#dbdfe6] dark:border-gray-800 shadow-sm p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span
            className={`${currentStatus.className} text-xs font-bold px-2 py-1 rounded uppercase`}
          >
            {currentStatus.label}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className={`transition-colors ${
                isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <span className="material-symbols-outlined">
                {isFavorited ? 'favorite' : 'favorite_border'}
              </span>
            </button>
            <button className="text-gray-400 hover:text-blue-500 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
        <div>
          <p className="text-sm text-[#616f89] font-medium mb-1">Deposit / Monthly Rent</p>
          <div className="flex items-baseline gap-1 text-[#111318] dark:text-white">
            <span className="text-3xl font-black tracking-tight text-primary">{deposit}</span>
            <span className="text-xl font-bold">/</span>
            <span className="text-3xl font-black tracking-tight text-primary">{rent}</span>
            <span className="text-lg font-bold ml-1">KRW</span>
          </div>
          {vatExcluded && <p className="text-xs text-[#616f89] mt-2">+ VAT Excluded</p>}
        </div>
        <hr className="border-[#f0f2f4] dark:border-gray-800" />
        {/* Agent Profile */}
        {agentName && (
          <div className="flex items-center gap-3">
            {agentImageUrl ? (
              <Image
                src={agentImageUrl}
                alt={agentImageAlt || 'Agent profile'}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500">person</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#111318] dark:text-white">{agentName}</p>
              {agentCompany && (
                <p className="text-xs text-[#616f89]">{agentCompany}</p>
              )}
            </div>
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onContact}
            className="w-full h-12 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <span className="material-symbols-outlined text-[20px]">call</span>
            Contact Agent
          </button>
          <button
            onClick={onMessage}
            className="w-full h-12 bg-white dark:bg-gray-800 border border-[#dbdfe6] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[#111318] dark:text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
            Send Message
          </button>
        </div>
      </div>
      {/* Safety Banner */}
      <div className="bg-[#f0f2f4] dark:bg-gray-800 rounded-lg p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-gray-500 mt-0.5">verified_user</span>
        <div>
          <h4 className="text-sm font-bold text-[#111318] dark:text-white">
            Safe Transaction Guarantee
          </h4>
          <p className="text-xs text-[#616f89] mt-1 leading-normal">
            This property has been verified by Daegu Commercial&apos;s on-site team. Report any
            discrepancies for a reward.
          </p>
        </div>
      </div>
    </div>
  )
}

