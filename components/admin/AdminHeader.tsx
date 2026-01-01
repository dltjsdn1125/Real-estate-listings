'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'

interface AdminHeaderProps {
  title?: string
}

export default function AdminHeader({ title = 'Daegu Admin' }: AdminHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
}

