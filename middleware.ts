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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // 디버깅 로그
  if (pathname.startsWith('/admin')) {
    console.log('🔒 Middleware - Admin Access:', {
      pathname,
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email
    })
  }

  // 관리자 페이지 보호 - 간소화 (세션만 체크, 권한은 페이지 레벨에서)
  if (pathname.startsWith('/admin')) {
    if (!session) {
      console.log('❌ Middleware - No session, redirecting to login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    console.log('✅ Middleware - Session found, allowing access')
    // 권한 체크는 각 페이지 컴포넌트에서 useAuth로 처리
  }

  // 로그인 상태에서 auth 페이지 접근 시 지도로 리다이렉트
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/map', request.url))
  }

  return response
}

// 미들웨어를 비활성화 - 페이지 레벨에서 권한 체크
export const config = {
  matcher: [],  // 빈 배열로 미들웨어 비활성화
}

