-- 샘플 데이터 1000건 생성 (MCP Supabase용)
-- 대구 상가 매물 데이터

-- 임시 함수: 랜덤 좌표 생성
CREATE OR REPLACE FUNCTION random_between(low DECIMAL, high DECIMAL) 
RETURNS DECIMAL AS $$
BEGIN
  RETURN low + (random() * (high - low));
END;
$$ LANGUAGE plpgsql;

-- 샘플 매물 데이터 생성
DO $$
DECLARE
  districts TEXT[] := ARRAY['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'];
  property_types TEXT[] := ARRAY['상가', '사무실', '건물'];
  transaction_types TEXT[] := ARRAY['rent_monthly', 'rent_yearly', 'sale', 'lease'];
  business_types TEXT[] := ARRAY['음식점', '카페', '소매업', '서비스업', '학원', '병원', '사무실', '기타'];
  tags TEXT[] := ARRAY['역세권', '대로변', '코너', '1층', '신축', '리모델링', '무권리', '저권리', '주차가능', '엘리베이터'];
  
  district TEXT;
  property_type TEXT;
  transaction_type TEXT;
  property_id UUID;
  
  i INTEGER;
  j INTEGER;
  tag_count INTEGER;
  business_count INTEGER;
BEGIN
  FOR i IN 1..1000 LOOP
    -- 랜덤 선택
    district := districts[1 + floor(random() * array_length(districts, 1))::int];
    property_type := property_types[1 + floor(random() * array_length(property_types, 1))::int];
    transaction_type := transaction_types[1 + floor(random() * array_length(transaction_types, 1))::int];
    
    -- 매물 삽입
    INSERT INTO public.properties (
      title,
      property_type,
      transaction_type,
      district,
      dong,
      address,
      detail_address,
      latitude,
      longitude,
      deposit,
      monthly_rent,
      yearly_rent,
      sale_price,
      key_money,
      maintenance_fee,
      vat_excluded,
      exclusive_area,
      contract_area,
      floor_current,
      floor_total,
      approval_date,
      has_elevator,
      has_parking,
      immediate_move_in,
      is_public,
      is_premium,
      status,
      allowed_business_types
    ) VALUES (
      district || ' ' || property_type || ' ' || (1 + floor(random() * 999)::int)::text || '호',
      property_type,
      transaction_type,
      district,
      CASE district
        WHEN '중구' THEN (ARRAY['동인동', '삼덕동', '성내동', '대신동', '남산동'])[1 + floor(random() * 5)::int]
        WHEN '동구' THEN (ARRAY['신천동', '효목동', '도평동', '불로동', '지저동'])[1 + floor(random() * 5)::int]
        WHEN '서구' THEN (ARRAY['내당동', '비산동', '평리동', '상리동', '원대동'])[1 + floor(random() * 5)::int]
        WHEN '남구' THEN (ARRAY['대명동', '봉덕동', '이천동', '대봉동'])[1 + floor(random() * 4)::int]
        WHEN '북구' THEN (ARRAY['산격동', '복현동', '대현동', '칠성동', '침산동'])[1 + floor(random() * 5)::int]
        WHEN '수성구' THEN (ARRAY['범어동', '만촌동', '수성동', '황금동', '중동'])[1 + floor(random() * 5)::int]
        WHEN '달서구' THEN (ARRAY['성당동', '두류동', '본리동', '이곡동', '월성동'])[1 + floor(random() * 5)::int]
        ELSE (ARRAY['화원읍', '논공읍', '옥포읍', '유가읍', '현풍읍'])[1 + floor(random() * 5)::int]
      END,
      (1 + floor(random() * 999)::int)::text,
      (1 + floor(random() * 15)::int)::text || '층',
      CASE district
        WHEN '중구' THEN random_between(35.85, 35.89)
        WHEN '동구' THEN random_between(35.87, 35.91)
        WHEN '서구' THEN random_between(35.85, 35.89)
        WHEN '남구' THEN random_between(35.83, 35.87)
        WHEN '북구' THEN random_between(35.87, 35.91)
        WHEN '수성구' THEN random_between(35.84, 35.88)
        WHEN '달서구' THEN random_between(35.81, 35.85)
        ELSE random_between(35.75, 35.80)
      END,
      CASE district
        WHEN '중구' THEN random_between(128.59, 128.63)
        WHEN '동구' THEN random_between(128.62, 128.66)
        WHEN '서구' THEN random_between(128.54, 128.58)
        WHEN '남구' THEN random_between(128.58, 128.62)
        WHEN '북구' THEN random_between(128.57, 128.61)
        WHEN '수성구' THEN random_between(128.62, 128.66)
        WHEN '달서구' THEN random_between(128.52, 128.56)
        ELSE random_between(128.41, 128.46)
      END,
      CASE WHEN transaction_type != 'sale' THEN (1000 + floor(random() * 49000)::int) * 10000 ELSE NULL END,
      CASE WHEN transaction_type = 'rent_monthly' THEN (50 + floor(random() * 450)::int) * 10000 ELSE NULL END,
      CASE WHEN transaction_type = 'rent_yearly' THEN (5000 + floor(random() * 25000)::int) * 10000 ELSE NULL END,
      CASE WHEN transaction_type = 'sale' THEN (50000 + floor(random() * 450000)::int) * 10000 ELSE NULL END,
      (floor(random() * 10000)::int) * 10000,
      (5 + floor(random() * 45)::int) * 10000,
      random() < 0.3,
      10 + floor(random() * 90)::decimal,
      15 + floor(random() * 105)::decimal,
      1 + floor(random() * 15)::int,
      2 + floor(random() * 13)::int,
      CURRENT_DATE - (floor(random() * 365)::int || ' days')::interval,
      random() < 0.7,
      random() < 0.5,
      random() < 0.6,
      TRUE,
      random() < 0.1,
      'available',
      (
        SELECT array_agg(bt)
        FROM (
          SELECT business_types[1 + floor(random() * array_length(business_types, 1))::int] as bt
          FROM generate_series(1, 2 + floor(random() * 4)::int)
        ) sub
      )
    )
    RETURNING id INTO property_id;
    
    -- 태그 삽입 (2-5개)
    tag_count := 2 + floor(random() * 4)::int;
    FOR j IN 1..tag_count LOOP
      INSERT INTO public.property_tags (property_id, tag)
      VALUES (
        property_id,
        tags[1 + floor(random() * array_length(tags, 1))::int]
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 진행상황 출력 (100개마다)
    IF i % 100 = 0 THEN
      RAISE NOTICE '진행: % / 1000 (%.0f%%)', i, (i::decimal / 1000 * 100);
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ 샘플 데이터 1000건 생성 완료!';
END $$;

-- 임시 함수 삭제
DROP FUNCTION IF EXISTS random_between(DECIMAL, DECIMAL);

