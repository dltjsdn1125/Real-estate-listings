'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/lib/supabase/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<any>(null)
  const initialCheckDone = useRef(false)

  useEffect(() => {
    // 이미 초기 체크가 완료되었으면 스킵
    if (initialCheckDone.current) return

    // 초기 체크 시작 표시
    initialCheckDone.current = true

    // 초기 세션 확인
    const checkAuth = async () => {
      try {
        // getUser()는 서버에서 토큰을 검증하므로 더 안정적
        const {
          data: { user: authUserData },
          error: authError,
        } = await supabase.auth.getUser()

        // 개발 환경에서만 디버깅 로그 출력 (초기 체크 시에만)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 useAuth - Initial User Check:', {
            hasUser: !!authUserData,
            userId: authUserData?.id,
            email: authUserData?.email,
            error: authError?.message
          })
        }

        // 인증 오류가 있으면 사용자 없음으로 처리
        // AuthSessionMissingError는 세션이 없을 때 발생하는 정상적인 오류이므로 조용히 처리
        if (authError) {
          // AuthSessionMissingError는 세션이 없는 정상적인 상태이므로 에러로 로깅하지 않음
          if (authError.name !== 'AuthSessionMissingError') {
            console.error('Auth check error:', authError)
          }
          setLoading(false)
          return
        }

        if (authUserData) {
          setAuthUser(authUserData)
          // users 테이블에서 사용자 정보 가져오기
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserData.id)
            .single()

          // 개발 환경에서만 디버깅 로그 출력 (초기 체크 시에만)
          if (process.env.NODE_ENV === 'development') {
            console.log('👤 useAuth - Initial User Data:', {
              hasData: !!data,
              error: error?.message,
              user: data ? { email: data.email, role: data.role, tier: data.tier } : null
            })
          }

          if (!error && data) {
            setUser(data)
          }
        }
      } catch (error: any) {
        // AuthSessionMissingError는 세션이 없는 정상적인 상태이므로 에러로 로깅하지 않음
        if (error?.name !== 'AuthSessionMissingError') {
          console.error('Auth check error:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 초기 체크가 완료되기 전에는 무시 (중복 처리 방지)
      if (!initialCheckDone.current) return

      // 개발 환경에서만 디버깅 로그 출력 (중요한 이벤트만)
      if (process.env.NODE_ENV === 'development' && (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')) {
        console.log('🔄 useAuth - Auth State Changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        })
      }

      if (event === 'SIGNED_OUT') {
        setAuthUser(null)
        setUser(null)
        return
      }

      if (session?.user) {
        setAuthUser(session.user)
        // users 테이블에서 사용자 정보 가져오기
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        // 개발 환경에서만 디버깅 로그 출력 (중요한 이벤트만)
        if (process.env.NODE_ENV === 'development' && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          console.log('👤 useAuth - State Change User Data:', {
            hasData: !!data,
            user: data ? { email: data.email, role: data.role, tier: data.tier } : null
          })
        }

        if (data) {
          setUser(data)
        }
      }
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

