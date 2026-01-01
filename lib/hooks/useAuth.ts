'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/lib/supabase/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<any>(null)

  useEffect(() => {
    // 초기 세션 확인
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log('🔐 useAuth - Session Check:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        })

        if (session?.user) {
          setAuthUser(session.user)
          // users 테이블에서 사용자 정보 가져오기
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('👤 useAuth - User Data:', {
            hasData: !!data,
            error: error?.message,
            user: data ? { email: data.email, role: data.role, tier: data.tier } : null
          })

          if (!error && data) {
            setUser(data)
          }
        } else {
          console.log('❌ useAuth - No session found')
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 useAuth - Auth State Changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id
      })

      if (session?.user) {
        setAuthUser(session.user)
        // users 테이블에서 사용자 정보 가져오기
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('👤 useAuth - State Change User Data:', {
          hasData: !!data,
          user: data ? { email: data.email, role: data.role, tier: data.tier } : null
        })

        if (data) {
          setUser(data)
        }
      } else {
        setAuthUser(null)
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAuthUser(null)
  }

  return {
    user,
    authUser,
    loading,
    isAuthenticated: !!authUser,
    isApproved: user?.approval_status === 'approved',
    signOut,
  }
}

