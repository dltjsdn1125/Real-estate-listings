'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const menuItems = [
    { href: '/map', icon: 'map', label: '매물 탐색' },
    { href: '/admin/properties/new', icon: 'add_circle', label: '매물 등록' },
    { href: '/admin/users', icon: 'group', label: '사용자 관리' },
    { href: '/admin/audit-logs', icon: 'history', label: '감사 로그' },
    { href: '/', icon: 'home', label: '홈으로' },
  ]

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="flex flex-col gap-4">
        {/* User Profile */}
        <div className="flex gap-3 items-center p-2 rounded-xl bg-background-light dark:bg-gray-800">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">account_circle</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#111318] dark:text-white text-base font-bold leading-normal">
              {user?.full_name || '관리자'}
            </h1>
            <p className="text-[#616f89] dark:text-gray-400 text-sm font-normal leading-normal">
              {user?.tier || 'admin'} 등급
            </p>
          </div>
        </div>
        <div className="h-px bg-[#f0f2f4] dark:bg-gray-800 w-full my-1"></div>
        {/* Navigation Links */}
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-[#616f89] dark:text-gray-400 hover:bg-background-light dark:hover:bg-gray-800'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[24px] ${
                    isActive ? 'fill-1' : 'group-hover:text-primary transition-colors'
                  }`}
                >
                  {item.icon}
                </span>
                <p
                  className={`text-sm leading-normal ${
                    isActive
                      ? 'font-bold'
                      : 'font-medium group-hover:text-[#111318] dark:group-hover:text-white transition-colors'
                  }`}
                >
                  {item.label}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#616f89] dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">logout</span>
          <p className="text-sm font-medium leading-normal">로그아웃</p>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: 항상 보이는 사이드바 */}
      <aside className="hidden lg:flex flex-col w-[280px] border-r border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#111318] sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile: 슬라이드 사이드바 */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        {/* Sidebar */}
        <aside className="absolute left-0 top-0 h-full w-[280px] flex flex-col border-r border-[#f0f2f4] dark:border-gray-800 bg-white dark:bg-[#111318] shadow-xl">
          {sidebarContent}
        </aside>
      </div>
    </>
  )
}

