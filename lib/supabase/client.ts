import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jnpxwcmshukhkxdzicwv.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucHh3Y21zaHVraGt4ZHppY3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTQ0NzEsImV4cCI6MjA4Mjc5MDQ3MX0.C7ZXSR7t15qGShP8FhHlw0r7pLMYSDrmrR7ubb7ofOA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 무효한 토큰 오류를 조용히 처리
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // 토큰 갱신 실패 시 자동으로 세션 정리
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // 토큰 갱신 실패 시 자동으로 정리하지 않고 useAuth에서 처리
    flowType: 'pkce',
  },
})

