import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const width = searchParams.get('width') || '640'
  const height = searchParams.get('height') || '360'
  const level = searchParams.get('level') || '3'
  const hasRoadview = searchParams.get('roadview') === 'true'

  console.log('📸 Static Map API Request:', { lat, lng, width, height, level, hasRoadview })

  if (!lat || !lng) {
    console.error('❌ Static Map API - Missing parameters:', { lat, lng })
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

  if (!apiKey) {
    console.error('❌ Static Map API - API key not configured')
    return NextResponse.json({ error: 'Kakao API key not configured' }, { status: 500 })
  }

  // Kakao Static Map API URL 생성
  // 참고: Kakao Static Map API는 markers=roadview 파라미터를 지원하지 않습니다
  // 로드뷰가 있는 경우에도 일반 정적 지도 이미지를 사용하고,
  // 로드뷰 존재 여부는 클라이언트에서 별도로 표시합니다
  const url = `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=${level}&size=${width}x${height}&format=png`

  try {
    console.log('📡 Calling Kakao Static Map API:', { 
      url: url.replace(apiKey, '***'),
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0
    })
    
    // Kakao API 호출
    const response = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
      },
    })

    console.log('📡 Kakao API Response:', { 
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      ok: response.ok
    })

    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = 'Failed to read error response'
      }
      
      console.error('❌ Kakao Static Map API error:', {
        status: response.status,
        statusText: response.statusText,
        url: url.replace(apiKey, '***'),
        error: errorText,
        headers: Object.fromEntries(response.headers.entries()),
      })
      
      // 401, 403 오류는 API 키 문제일 가능성이 높음
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ 
          error: 'Kakao API authentication failed',
          details: 'API key may be invalid or not have REST API permissions. Static Map API requires REST API key, not JavaScript key.',
          status: response.status,
          kakaoError: errorText
        }, { status: 500 })
      }
      
      throw new Error(`Kakao API error: ${response.status} - ${errorText}`)
    }

    // 이미지 데이터를 그대로 반환
    const imageBuffer = await response.arrayBuffer()
    console.log('✅ Static Map image fetched successfully:', { size: imageBuffer.byteLength })
    
    if (imageBuffer.byteLength === 0) {
      throw new Error('Received empty image buffer')
    }
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // 24시간 캐시
      },
    })
  } catch (error: any) {
    console.error('❌ Error fetching static map:', {
      error: error?.message || error,
      stack: error?.stack,
      url: url.replace(apiKey, '***'),
      lat,
      lng,
      hasRoadview,
      errorType: error?.constructor?.name,
    })
    
    // 오류 발생 시 기본 placeholder 이미지 반환 (SVG)
    // 간단한 지도 placeholder 이미지 생성
    const placeholderSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
        font-family="Arial, sans-serif" font-size="16" fill="#9ca3af">
    지도 이미지
  </text>
  <circle cx="50%" cy="50%" r="8" fill="#3b82f6" opacity="0.6"/>
</svg>`
    
    return new NextResponse(placeholderSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
      },
    })
  }
}

