'use client'

interface UserStatsProps {
  total: number
  pending: number
  premium: number
  admin: number
  totalChange?: string
  pendingChange?: string
}

export default function UserStats({
  total,
  pending,
  premium,
  admin,
  totalChange,
  pendingChange,
}: UserStatsProps) {
  const stats = [
    {
      label: '전체 사용자',
      value: total.toLocaleString(),
      change: totalChange,
      icon: 'group',
      iconColor: 'text-primary',
    },
    {
      label: '승인 대기 (중개사)',
      value: pending.toString(),
      change: pendingChange,
      icon: 'pending_actions',
      iconColor: 'text-orange-500',
      isPositive: true,
    },
    {
      label: '프리미엄 회원',
      value: premium.toLocaleString(),
      change: '0% 변동 없음',
      icon: 'workspace_premium',
      iconColor: 'text-purple-500',
    },
    {
      label: '관리자 계정',
      value: admin.toString(),
      detail: '시스템 관리자 포함',
      icon: 'admin_panel_settings',
      iconColor: 'text-slate-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="flex flex-col gap-1 rounded-xl border border-[#dbdfe6] bg-white p-5 shadow-sm dark:bg-[#1e293b] dark:border-[#334155]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#616f89] dark:text-slate-400">{stat.label}</p>
            <span className={`material-symbols-outlined ${stat.iconColor} text-[24px]`}>
              {stat.icon}
            </span>
          </div>
          <p className="text-2xl font-bold text-[#111318] dark:text-white">{stat.value}</p>
          {stat.change && (
            <p
              className={`text-sm font-medium flex items-center gap-1 ${
                stat.isPositive ? 'text-[#07883b]' : 'text-[#616f89] dark:text-slate-500'
              }`}
            >
              {stat.isPositive && (
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
              )}
              {!stat.isPositive && stat.change.includes('0%') && (
                <span className="material-symbols-outlined text-[16px]">remove</span>
              )}
              {stat.change}
            </p>
          )}
          {stat.detail && (
            <p className="text-sm font-medium text-[#616f89] dark:text-slate-500">{stat.detail}</p>
          )}
        </div>
      ))}
    </div>
  )
}

