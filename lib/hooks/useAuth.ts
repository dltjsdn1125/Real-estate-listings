'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@/lib/supabase/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<any>(null)
  const initialCheckDone = useRef(false)

  // 인증 상태 확인 함수 (재사용 가능)
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
        if (authError) {
          // 무효한 refresh token 오류 처리
          const isInvalidTokenError = 
            authError.message?.includes('Invalid Refresh Token') ||
            authError.message?.includes('Refresh Token Not Found') ||
            authError.message?.includes('JWT') ||
            authError.name === 'AuthSessionMissingError'

          // 무효한 토큰이 발견되면 세션 정리
          if (isInvalidTokenError && authError.name !== 'AuthSessionMissingError') {
            // 로컬 세션 정리 (무음으로 처리)
            try {
              await supabase.auth.signOut({ scope: 'local' })
            } catch (signOutError) {
              // 정리 실패는 무시 (이미 무효한 상태)
            }
          }

          // AuthSessionMissingError는 세션이 없는 정상적인 상태이므로 에러로 로깅하지 않음
          if (!isInvalidTokenError && process.env.NODE_ENV === 'development') {
            console.warn('Auth check error:', authError.message)
          }
          
          setAuthUser(null)
          setUser(null)
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
        // 무효한 토큰 오류 처리
        const isInvalidTokenError = 
          error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('Refresh Token Not Found') ||
          error?.message?.includes('JWT') ||
          error?.name === 'AuthSessionMissingError'

        // 무효한 토큰이 발견되면 세션 정리
        if (isInvalidTokenError && error?.name !== 'AuthSessionMissingError') {
          try {
            await supabase.auth.signOut({ scope: 'local' })
          } catch (signOutError) {
            // 정리 실패는 무시
          }
          setAuthUser(null)
          setUser(null)
        }

        // AuthSessionMissingError는 세션이 없는 정상적인 상태이므로 에러로 로깅하지 않음
        // 무효한 토큰 오류도 조용히 처리 (이미 정리했으므로)
        if (!isInvalidTokenError && process.env.NODE_ENV === 'development') {
          console.warn('Auth check error:', error?.message || error)
        }
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    // 이미 초기 체크가 완료되었으면 스킵 (단, BFCache 복원 시에는 재확인)
    if (initialCheckDone.current) {
      // BFCache 복원 시 재확인을 위한 핸들러는 별도로 등록
      return
    }

    // 초기 체크 시작 표시
    initialCheckDone.current = true

    // 초기 세션 확인
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

    // BFCache 복원 시 인증 상태 재확인
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log('🔄 useAuth - BFCache 복원, 인증 상태 재확인')
        // 로딩 상태로 설정하고 재확인
        setLoading(true)
        checkAuth().finally(() => {
          setLoading(false)
        })
      }
    }

    // focus 이벤트에서도 재확인 (뒤로가기 후 포커스 복원 시)
    const handleFocus = () => {
      // 짧은 딜레이 후 재확인 (다른 페이지에서 돌아올 때)
      // 상태는 항상 최신이므로 조건 확인을 위해 약간의 딜레이 사용
      setTimeout(() => {
        if (initialCheckDone.current) {
          console.log('🔄 useAuth - 포커스 복원, 인증 상태 재확인')
          setLoading(true)
          checkAuth().finally(() => {
            setLoading(false)
          })
        }
      }, 100)
    }

    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('focus', handleFocus)
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

