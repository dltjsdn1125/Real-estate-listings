import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { setting_key, setting_value, description } = await request.json()

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 서버 사이드 Supabase 클라이언트 (service role key 사용)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // admin_settings 테이블이 없으면 생성 (자동 처리)
    const { error: upsertError } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key,
        setting_value,
        description: description || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_key',
      })

    if (upsertError) {
      console.error('Settings upsert error:', upsertError)
      return NextResponse.json(
        { error: upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const settingKey = searchParams.get('key')

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let query = supabase.from('admin_settings').select('*')
    
    if (settingKey) {
      query = query.eq('setting_key', settingKey).single()
    }

    const { data, error } = await query

    if (error) {
      console.error('Settings fetch error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Settings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

