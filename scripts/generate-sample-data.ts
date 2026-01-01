/**
 * 대구 상가 매물 샘플 데이터 생성 스크립트
 * 1000건의 샘플 매물 데이터를 생성합니다.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 대구 구별 좌표 데이터
const DAEGU_DISTRICTS = {
  중구: { lat: 35.8691, lng: 128.6061, dongs: ['동인동', '삼덕동', '성내동', '대신동', '남산동'] },
  동구: { lat: 35.8869, lng: 128.6358, dongs: ['신천동', '효목동', '도평동', '불로동', '지저동'] },
  서구: { lat: 35.8719, lng: 128.5592, dongs: ['내당동', '비산동', '평리동', '상리동', '원대동'] },
  남구: { lat: 35.8463, lng: 128.5973, dongs: ['대명동', '봉덕동', '이천동', '대봉동'] },
  북구: { lat: 35.8858, lng: 128.5828, dongs: ['산격동', '복현동', '대현동', '칠성동', '침산동'] },
  수성구: { lat: 35.8581, lng: 128.6311, dongs: ['범어동', '만촌동', '수성동', '황금동', '중동'] },
  달서구: { lat: 35.8294, lng: 128.5325, dongs: ['성당동', '두류동', '본리동', '이곡동', '월성동'] },
  달성군: { lat: 35.7741, lng: 128.4311, dongs: ['화원읍', '논공읍', 'option읍', '유가읍', '현풍읍'] },
}

const PROPERTY_TYPES = ['상가', '사무실', '건물']
const TRANSACTION_TYPES = ['rent_monthly', 'rent_yearly', 'sale', 'lease']
const BUSINESS_TYPES = ['음식점', '카페', '소매업', '서비스업', '학원', '병원', '사무실', '기타']
const TAGS = [
  '역세권',
  '대로변',
  '코너',
  '1층',
  '신축',
  '리모델링',
  '무권리',
  '저권리',
  '주차가능',
  '엘리베이터',
  '화장실별도',
  '덕트설치',
]

// 랜덤 숫자 생성
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// 랜덤 배열 요소 선택
const randomChoice = <T,>(arr: T[]): T => arr[random(0, arr.length - 1)]

// 랜덤 배열 요소 여러 개 선택
const randomChoices = <T,>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// 좌표 약간 변경 (같은 구 내에서)
const jitterCoord = (coord: number, range: number = 0.01) => {
  return coord + (Math.random() - 0.5) * range
}

// 매물 데이터 생성
function generateProperty(index: number) {
  const district = randomChoice(Object.keys(DAEGU_DISTRICTS))
  const districtData = DAEGU_DISTRICTS[district as keyof typeof DAEGU_DISTRICTS]
  const dong = randomChoice(districtData.dongs)
  const propertyType = randomChoice(PROPERTY_TYPES)
  const transactionType = randomChoice(TRANSACTION_TYPES)

  // 가격 생성 (만원 단위)
  const deposit = transactionType !== 'sale' ? random(1000, 50000) * 10000 : null
  const monthlyRent = transactionType === 'rent_monthly' ? random(50, 500) * 10000 : null
  const yearlyRent = transactionType === 'rent_yearly' ? random(5000, 30000) * 10000 : null
  const salePrice = transactionType === 'sale' ? random(50000, 500000) * 10000 : null
  const keyMoney = random(0, 10000) * 10000
  const maintenanceFee = random(5, 50) * 10000

  // 면적 (평)
  const exclusiveArea = random(10, 100)
  const contractArea = exclusiveArea + random(5, 20)

  // 층수
  const floorTotal = random(2, 15)
  const floorCurrent = random(1, floorTotal)

  // 좌표 (구 중심에서 약간 변경)
  const latitude = jitterCoord(districtData.lat, 0.02)
  const longitude = jitterCoord(districtData.lng, 0.02)

  // 제목 생성
  const titles = [
    `${district} ${dong} ${propertyType} ${floorCurrent}층`,
    `${dong} 메인상권 ${propertyType}`,
    `${district} 역세권 ${propertyType} 임대`,
    `${dong} 코너 ${propertyType} 무권리`,
    `${district} 대로변 ${propertyType}`,
  ]
  const title = randomChoice(titles)

  // 태그 선택
  const selectedTags = randomChoices(TAGS, random(2, 5))

  // 업종 선택
  const allowedBusinessTypes = randomChoices(BUSINESS_TYPES, random(2, 6))

  // 프리미엄 여부 (10% 확률)
  const isPremium = Math.random() < 0.1

  return {
    title,
    property_type: propertyType,
    transaction_type: transactionType,
    district,
    dong,
    address: `${dong} ${random(1, 999)}`,
    detail_address: `${floorCurrent}층`,
    hide_detail_address: false,
    latitude,
    longitude,
    deposit,
    monthly_rent: monthlyRent,
    yearly_rent: yearlyRent,
    sale_price: salePrice,
    key_money: keyMoney,
    maintenance_fee: maintenanceFee,
    vat_excluded: Math.random() < 0.3,
    exclusive_area: exclusiveArea,
    contract_area: contractArea,
    floor_current: floorCurrent,
    floor_total: floorTotal,
    approval_date: new Date(Date.now() - random(0, 365) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    has_elevator: floorTotal > 3 && Math.random() < 0.7,
    has_parking: Math.random() < 0.5,
    immediate_move_in: Math.random() < 0.6,
    is_public: true,
    is_premium: isPremium,
    status: 'available',
    created_by: null,
    agent_id: null,
    allowed_business_types: allowedBusinessTypes,
    tags: selectedTags,
  }
}

async function main() {
  console.log('🚀 샘플 데이터 생성 시작...')
  console.log('📊 생성할 데이터: 1000건')

  const BATCH_SIZE = 50 // 한 번에 50개씩 삽입
  const TOTAL_COUNT = 1000

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < TOTAL_COUNT; i += BATCH_SIZE) {
    const batch = []
    const batchEnd = Math.min(i + BATCH_SIZE, TOTAL_COUNT)

    // 배치 데이터 생성
    for (let j = i; j < batchEnd; j++) {
      const property = generateProperty(j)
      batch.push(property)
    }

    try {
      // 매물 삽입
      const { data: properties, error: propertyError } = await supabase
        .from('properties')
        .insert(
          batch.map(({ tags, ...rest }) => rest) // tags는 별도 처리
        )
        .select('id')

      if (propertyError) {
        console.error(`❌ 배치 ${i / BATCH_SIZE + 1} 삽입 실패:`, propertyError.message)
        errorCount += batch.length
        continue
      }

      // 태그 삽입
      if (properties && properties.length > 0) {
        const tagInserts = []
        for (let k = 0; k < properties.length; k++) {
          const property = properties[k]
          const tags = batch[k].tags
          for (const tag of tags) {
            tagInserts.push({
              property_id: property.id,
              tag,
            })
          }
        }

        const { error: tagError } = await supabase.from('property_tags').insert(tagInserts)

        if (tagError) {
          console.warn(`⚠️ 배치 ${i / BATCH_SIZE + 1} 태그 삽입 실패:`, tagError.message)
        }
      }

      successCount += batch.length
      console.log(
        `✅ 배치 ${i / BATCH_SIZE + 1}/${Math.ceil(TOTAL_COUNT / BATCH_SIZE)} 완료 (${successCount}/${TOTAL_COUNT})`
      )
    } catch (error) {
      console.error(`❌ 배치 ${i / BATCH_SIZE + 1} 오류:`, error)
      errorCount += batch.length
    }

    // API 요청 제한 방지를 위한 짧은 대기
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n📊 최종 결과:')
  console.log(`✅ 성공: ${successCount}건`)
  console.log(`❌ 실패: ${errorCount}건`)
  console.log(`📈 성공률: ${((successCount / TOTAL_COUNT) * 100).toFixed(1)}%`)
  console.log('\n🎉 샘플 데이터 생성 완료!')
}

main().catch((error) => {
  console.error('❌ 스크립트 실행 오류:', error)
  process.exit(1)
})

