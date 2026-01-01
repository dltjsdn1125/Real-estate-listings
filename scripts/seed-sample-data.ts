/**
 * 초기 샘플 데이터 생성 스크립트
 * 
 * 실행 방법:
 * npx tsx scripts/seed-sample-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jnpxwcmshukhkxdzicwv.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucHh3Y21zaHVraGt4ZHppY3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTQ0NzEsImV4cCI6MjA4Mjc5MDQ3MX0.C7ZXSR7t15qGShP8FhHlw0r7pLMYSDrmrR7ubb7ofOA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedSampleData() {
  console.log('🌱 샘플 데이터 생성 시작...\n')

  try {
    // 1. 안내 메시지
    console.log('1️⃣ 샘플 데이터 생성 준비 중...')
    console.log('   ℹ️  매물 생성 시 created_by 필드는 제외됩니다.')
    console.log('   ℹ️  properties 테이블의 created_by가 NOT NULL이면 오류가 발생할 수 있습니다.')
    console.log('   ℹ️  필요시 Supabase 대시보드에서 다음 SQL을 실행하세요:')
    console.log('      ALTER TABLE public.properties ALTER COLUMN created_by DROP NOT NULL;')
    console.log('')

    // 2. 샘플 매물 생성
    console.log('2️⃣ 샘플 매물 생성 중...')
    const sampleProperties = [
      {
        title: '동성로 코너 상가 - 높은 유동인구',
        property_type: 'store',
        transaction_type: 'rent_monthly',
        status: 'available',
        district: '중구',
        dong: '동성로',
        address: '대구광역시 중구 동성로2가 123',
        latitude: 35.8714,
        longitude: 128.5978,
        floor_current: 1,
        floor_total: 5,
        contract_area: 40,
        exclusive_area: 30,
        deposit: 50000000,
        monthly_rent: 3500000,
        maintenance_fee: 200000,
        has_parking: true,
        has_elevator: true,
        immediate_move_in: true,
        description: `동성로 중심가에 위치한 코너 상가입니다. 높은 유동인구와 뛰어난 접근성으로 카페, 음식점, 소매점 등 다양한 업종에 적합합니다.

**주요 특징:**
- 코너 자리로 시야 확보 우수
- 대형 창문으로 자연 채광 우수
- 주변 상권 활성화
- 대중교통 접근성 우수

* 내부 인테리어는 협의 가능합니다.`,
        is_premium: false,
      },
      {
        title: '수성구 프리미엄 오피스 - 고층 전망',
        property_type: 'office',
        transaction_type: 'rent_monthly',
        status: 'available',
        district: '수성구',
        dong: '범어동',
        address: '대구광역시 수성구 범어동 456',
        latitude: 35.8581,
        longitude: 128.6311,
        floor_current: 12,
        floor_total: 20,
        contract_area: 50,
        exclusive_area: 40,
        deposit: 100000000,
        monthly_rent: 5000000,
        maintenance_fee: 300000,
        has_parking: true,
        has_elevator: true,
        immediate_move_in: false,
        description: `수성구 프리미엄 오피스 빌딩 고층에 위치한 사무실입니다. 넓은 공간과 뛰어난 전망을 자랑합니다.

**주요 특징:**
- 고층 전망으로 쾌적한 업무 환경
- 주차 2대 가능
- 24시간 보안 시스템
- 범어역 도보 3분 거리

* 법인 사무실, IT 기업 등에 적합합니다.`,
        is_premium: true,
      },
      {
        title: '경북대 근처 소형 카페 매물',
        property_type: 'store',
        transaction_type: 'rent_monthly',
        status: 'available',
        district: '북구',
        dong: '산격동',
        address: '대구광역시 북구 산격동 789',
        latitude: 35.8889,
        longitude: 128.6117,
        floor_current: 1,
        floor_total: 3,
        contract_area: 20,
        exclusive_area: 15,
        deposit: 20000000,
        monthly_rent: 1200000,
        maintenance_fee: 100000,
        has_parking: false,
        has_elevator: false,
        immediate_move_in: true,
        description: `경북대학교 정문 근처 소형 카페 매물입니다. 학생 고객층이 안정적이며, 저렴한 임대료로 창업에 적합합니다.

**주요 특징:**
- 경북대 정문 도보 5분
- 안정적인 학생 고객층
- 기존 카페 인테리어 포함
- 저렴한 임대료

* 1인 창업자에게 추천합니다.`,
        is_premium: false,
      },
      {
        title: '반월당역 대형 상가 건물 매매',
        property_type: 'building',
        transaction_type: 'sale',
        status: 'available',
        district: '중구',
        dong: '대봉동',
        address: '대구광역시 중구 대봉동 321',
        latitude: 35.8583,
        longitude: 128.5917,
        floor_current: null,
        floor_total: 5,
        contract_area: 200,
        exclusive_area: 180,
        sale_price: 3000000000,
        maintenance_fee: 0,
        has_parking: true,
        has_elevator: true,
        immediate_move_in: false,
        description: `반월당역 인근 대형 상가 건물 매매 물건입니다. 안정적인 임대 수익이 보장되는 수익형 부동산입니다.

**주요 특징:**
- 반월당역 도보 2분
- 5층 건물 전체 매매
- 현재 임대율 95% 이상
- 연 수익률 약 5%

* 투자 목적으로 적합한 물건입니다.`,
        is_premium: true,
      },
      {
        title: '서문시장 근처 음식점 매물',
        property_type: 'store',
        transaction_type: 'rent_yearly',
        status: 'available',
        district: '중구',
        dong: '대신동',
        address: '대구광역시 중구 대신동 654',
        latitude: 35.8711,
        longitude: 128.5811,
        floor_current: 1,
        floor_total: 4,
        contract_area: 35,
        exclusive_area: 28,
        deposit: 30000000,
        yearly_rent: 36000000,
        maintenance_fee: 150000,
        has_parking: false,
        has_elevator: false,
        immediate_move_in: false,
        description: `서문시장 인근 음식점 매물입니다. 높은 유동인구와 저렴한 임대료로 음식점 창업에 최적입니다.

**주요 특징:**
- 서문시장 도보 3분
- 기존 음식점 시설 포함
- 높은 유동인구
- 주변 상권 활성화

* 한식, 분식 등 다양한 업종 가능합니다.`,
        is_premium: false,
      },
    ]

    const { data: createdProperties, error: propertyError } = await supabase
      .from('properties')
      .insert(sampleProperties)
      .select()

    if (propertyError) {
      console.error('   ✗ 매물 생성 실패:', propertyError.message)
      throw propertyError
    }

    console.log(`   ✓ ${createdProperties?.length || 0}개 매물 생성 완료`)

    // 3. 매물에 태그 연결
    console.log('\n3️⃣ 매물 태그 연결 중...')
    if (createdProperties) {
      const propertyTags = []

      // 첫 번째 매물: 역세권, 코너, 주차가능
      propertyTags.push(
        { property_id: createdProperties[0].id, tag: '역세권' },
        { property_id: createdProperties[0].id, tag: '코너' },
        { property_id: createdProperties[0].id, tag: '주차가능' }
      )

      // 두 번째 매물: 역세권, 주차가능, 엘리베이터
      propertyTags.push(
        { property_id: createdProperties[1].id, tag: '역세권' },
        { property_id: createdProperties[1].id, tag: '주차가능' },
        { property_id: createdProperties[1].id, tag: '엘리베이터' }
      )

      // 세 번째 매물: 역세권
      propertyTags.push(
        { property_id: createdProperties[2].id, tag: '역세권' }
      )

      // 네 번째 매물: 역세권, 주차가능, 엘리베이터
      propertyTags.push(
        { property_id: createdProperties[3].id, tag: '역세권' },
        { property_id: createdProperties[3].id, tag: '주차가능' },
        { property_id: createdProperties[3].id, tag: '엘리베이터' }
      )

      // 다섯 번째 매물: 역세권
      propertyTags.push(
        { property_id: createdProperties[4].id, tag: '역세권' }
      )

      const { error: tagLinkError } = await supabase
        .from('property_tags')
        .insert(propertyTags)

      if (tagLinkError) {
        console.error('   ✗ 태그 연결 실패:', tagLinkError.message)
      } else {
        console.log(`   ✓ ${propertyTags.length}개 태그 연결 완료`)
      }
    }

    // 4. 샘플 이미지 URL 추가 (실제 이미지는 Storage에 업로드 필요)
    console.log('\n4️⃣ 샘플 이미지 URL 추가 중...')
    if (createdProperties) {
      const sampleImages = [
        // 첫 번째 매물 이미지
        {
          property_id: createdProperties[0].id,
          image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
          display_order: 1,
          is_main: true,
          image_alt: '외부 전경',
        },
        {
          property_id: createdProperties[0].id,
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
          display_order: 2,
          is_main: false,
          image_alt: '내부 전경',
        },
        // 두 번째 매물 이미지
        {
          property_id: createdProperties[1].id,
          image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
          display_order: 1,
          is_main: true,
          image_alt: '오피스 전경',
        },
        {
          property_id: createdProperties[1].id,
          image_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
          display_order: 2,
          is_main: false,
          image_alt: '회의실',
        },
        // 세 번째 매물 이미지
        {
          property_id: createdProperties[2].id,
          image_url: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800',
          display_order: 1,
          is_main: true,
          image_alt: '카페 내부',
        },
        // 네 번째 매물 이미지
        {
          property_id: createdProperties[3].id,
          image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
          display_order: 1,
          is_main: true,
          image_alt: '건물 외관',
        },
        // 다섯 번째 매물 이미지
        {
          property_id: createdProperties[4].id,
          image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
          display_order: 1,
          is_main: true,
          image_alt: '음식점 내부',
        },
      ]

      const { error: imageError } = await supabase
        .from('property_images')
        .insert(sampleImages)

      if (imageError) {
        console.error('   ✗ 이미지 추가 실패:', imageError.message)
      } else {
        console.log(`   ✓ ${sampleImages.length}개 이미지 추가 완료`)
      }
    }

    console.log('\n✅ 샘플 데이터 생성 완료!\n')
    console.log('📊 생성된 데이터:')
    console.log(`   - 사용자: 1명 (관리자)`)
    console.log(`   - 매물: ${createdProperties?.length || 0}개`)
    console.log(`   - 태그: 14개`)
    console.log(`   - 이미지: 7개`)
    console.log('\n🎉 이제 http://localhost:3001/map 에서 매물을 확인할 수 있습니다!')

  } catch (error) {
    console.error('\n❌ 샘플 데이터 생성 중 오류 발생:', error)
    process.exit(1)
  }
}

// 스크립트 실행
seedSampleData()

