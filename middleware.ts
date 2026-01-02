import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // getUser()는 서버에서 토큰을 검증하므로 더 안전함
  // 에러가 발생해도 계속 진행 (비로그인 사용자도 접근 가능한 페이지가 있음)
  let user = null
  try {
    const {
      data: { user: userData },
      error,
    } = await supabase.auth.getUser()
    
    if (!error && userData) {
      user = userData
    }
  } catch (error) {
    // 인증 오류는 무시하고 계속 진행 (비로그인 사용자 허용)
    console.error('Middleware auth check error:', error)
  }

  const pathname = request.nextUrl.pathname

  // 디버깅 로그 - 모든 쿠키 확인
  if (pathname.startsWith('/admin')) {
    const allCookies = request.cookies.getAll()
    const cookieNames = allCookies.map(c => c.name)
    const hasAccessToken = !!request.cookies.get('sb-access-token')
    const hasRefreshToken = !!request.cookies.get('sb-refresh-token')
    
    console.log('🔒 Middleware - Admin Access:', {
      pathname,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      cookieNames,
      hasAccessToken,
      hasRefreshToken,
      allCookiesCount: allCookies.length
    })
  }

  // 관리자 페이지 보호 - 클라이언트 사이드에서만 체크 (Middleware에서는 통과)
  // useAuth와 각 페이지 컴포넌트에서 권한 체크를 수행하므로 여기서는 리다이렉트하지 않음
  if (pathname.startsWith('/admin')) {
    console.log('✅ Middleware - Admin route, allowing access (client-side auth check)', {
      pathname,
      hasUser: !!user,
      userId: user?.id
    })
    // 클라이언트 사이드에서 useAuth가 권한을 체크하므로 여기서는 통과
  }

  // 로그인 상태에서 auth 페이지 접근 시 처리
  if (pathname.startsWith('/auth') && user) {
    // pending 페이지는 승인되지 않은 사용자도 접근 가능
    if (pathname === '/auth/pending') {
      return response
    }

    // 승인 상태 확인 (에러 처리 추가)
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('approval_status')
        .eq('id', user.id)
        .single()

      // 데이터베이스 조회 오류 시 기본 응답 반환 (무한 리다이렉트 방지)
      if (userError) {
        console.error('Middleware - User data fetch error:', userError)
        // 오류 발생 시에도 페이지 접근 허용 (클라이언트에서 처리)
        return response
      }

      // 승인되지 않은 사용자는 pending 페이지로 리다이렉트
      if (userData?.approval_status !== 'approved') {
        return NextResponse.redirect(new URL('/auth/pending', request.url))
      }

      // 승인된 사용자는 map으로 리다이렉트
      return NextResponse.redirect(new URL('/map', request.url))
    } catch (error) {
      console.error('Middleware - Auth page access error:', error)
      // 에러 발생 시 기본 응답 반환
      return response
    }
  }

  return response
}

// 미들웨어 활성화 - admin과 auth 페이지만 보호
// /map은 비로그인 사용자도 접근 가능하므로 matcher에서 제외
export const config = {
  matcher: [
    '/admin/:path*',
    '/auth/:path*',
  ],
}

