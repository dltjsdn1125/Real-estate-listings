-- 대구 지역 실제 상가 샘플 데이터 50개 생성
-- 실제 위치 기반의 상가 매물 데이터

-- 기존 샘플 데이터 삭제 (선택사항)
-- DELETE FROM property_tags WHERE property_id IN (SELECT id FROM properties WHERE title LIKE '%샘플%');
-- DELETE FROM property_images WHERE property_id IN (SELECT id FROM properties WHERE title LIKE '%샘플%');
-- DELETE FROM properties WHERE title LIKE '%샘플%';

-- 임시 함수: 랜덤 숫자 생성
CREATE OR REPLACE FUNCTION random_between(low DECIMAL, high DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN low + (random() * (high - low));
END;
$$ LANGUAGE plpgsql;

-- 샘플 매물 데이터 생성
DO $$
DECLARE
  property_id UUID;
  i INTEGER;

  -- 대구 실제 상가 정보 (이름, 구, 동, 도로명주소, 위도, 경도)
  locations TEXT[][] := ARRAY[
    -- 중구 (동성로, 반월당 상권)
    ARRAY['동성로 메인 상가', '중구', '동성동', '동성로 50', '35.8686', '128.5963'],
    ARRAY['반월당역 지하상가', '중구', '남산동', '중앙대로 343', '35.8662', '128.5925'],
    ARRAY['CGV 대구 옆 상가', '중구', '공평동', '동성로 163', '35.8695', '128.5955'],
    ARRAY['대구백화점 맞은편 상가', '중구', '동성동', '명덕로 9', '35.8670', '128.5945'],
    ARRAY['중앙로역 상가', '중구', '종로1가', '중앙대로 401', '35.8645', '128.5890'],
    ARRAY['교동시장 입구 상가', '중구', '교동', '달구벌대로 2102', '35.8712', '128.5895'],
    ARRAY['약령시장 한방상가', '중구', '남성로', '남성로 51', '35.8690', '128.5870'],
    ARRAY['대구역 앞 상가', '중구', '칠성동', '태평로 161', '35.8785', '128.6273'],

    -- 수성구 (범어동, 만촌동 상권)
    ARRAY['범어네거리 코너 상가', '수성구', '범어동', '동대구로 325', '35.8589', '128.6293'],
    ARRAY['수성못 카페거리 상가', '수성구', '두산동', '용학로 200', '35.8315', '128.6175'],
    ARRAY['만촌역 역세권 상가', '수성구', '만촌동', '수성로 189', '35.8445', '128.6328'],
    ARRAY['황금네거리 상가', '수성구', '황금동', '달구벌대로 2420', '35.8495', '128.6375'],
    ARRAY['지산범물 상가', '수성구', '지산동', '지범로 57', '35.8195', '128.6410'],
    ARRAY['들안길 상가', '수성구', '범어동', '들안로 87', '35.8525', '128.6215'],
    ARRAY['수성구청 인근 상가', '수성구', '만촌동', '수성로 283', '35.8465', '128.6305'],

    -- 달서구 (성서, 월성 상권)
    ARRAY['성서공단 상가', '달서구', '성서동', '달구벌대로 1053', '35.8365', '128.5185'],
    ARRAY['월성동 로데오거리 상가', '달서구', '월성동', '월배로 251', '35.8195', '128.5485'],
    ARRAY['계명대 앞 상가', '달서구', '신당동', '달구벌대로 1095', '35.8545', '128.4875'],
    ARRAY['이곡동 홈플러스 옆 상가', '달서구', '이곡동', '달구벌대로 1245', '35.8495', '128.5345'],
    ARRAY['본리동 상가', '달서구', '본리동', '월배로 87', '35.8295', '128.5585'],
    ARRAY['송현동 주민센터 앞 상가', '달서구', '송현동', '성서로 197', '35.8265', '128.5195'],
    ARRAY['죽전역 상가', '달서구', '죽전동', '달구벌대로 1465', '35.8495', '128.5095'],

    -- 북구 (칠성시장, 산격동 상권)
    ARRAY['칠성시장 입구 상가', '북구', '칠성동', '칠성로 123', '35.8855', '128.5925'],
    ARRAY['경북대 앞 상가', '북구', '복현동', '대학로 80', '35.8895', '128.6115'],
    ARRAY['팔달시장 상가', '북구', '산격동', '칠곡중앙대로 289', '35.9025', '128.5765'],
    ARRAY['대구공항 인근 상가', '북구', '동천동', '동천로 55', '35.8945', '128.6325'],
    ARRAY['침산동 상가', '북구', '침산동', '침산로 95', '35.8865', '128.5805'],
    ARRAY['노원3가 상가', '북구', '노원동', '칠곡중앙대로 515', '35.9175', '128.5635'],

    -- 동구 (동대구역, 신천동 상권)
    ARRAY['동대구역 상가', '동구', '신천동', '동대구로 550', '35.8795', '128.6285'],
    ARRAY['신세계백화점 옆 상가', '동구', '신천동', '동부로 149', '35.8765', '128.6315'],
    ARRAY['혁신도시 상가', '동구', '신서동', '이노밸리로 20', '35.8895', '128.6565'],
    ARRAY['동촌유원지 상가', '동구', '검사동', '팔공로 297', '35.8925', '128.6475'],
    ARRAY['아양교 상가', '동구', '효목동', '아양로 205', '35.8735', '128.6415'],

    -- 서구 (평리동, 비산동 상권)
    ARRAY['서대구역 앞 상가', '서구', '평리동', '국채보상로 707', '35.8665', '128.5565'],
    ARRAY['비산네거리 상가', '서구', '비산동', '달서로 115', '35.8685', '128.5475'],
    ARRAY['상리동 상가', '서구', '상리동', '와룡로 55', '35.8595', '128.5515'],
    ARRAY['중리동 상가', '서구', '중리동', '국채보상로 627', '35.8625', '128.5605'],

    -- 남구 (대명동, 봉덕동 상권)
    ARRAY['대명역 상가', '남구', '대명동', '대명로 150', '35.8495', '128.5785'],
    ARRAY['앞산순환도로 상가', '남구', '대명동', '앞산순환로 1', '35.8295', '128.5825'],
    ARRAY['영대병원 앞 상가', '남구', '대명동', '영대로 33', '35.8465', '128.5745'],
    ARRAY['봉덕시장 상가', '남구', '봉덕동', '봉덕로 87', '35.8495', '128.5855'],
    ARRAY['이천동 상가', '남구', '이천동', '이천로 55', '35.8385', '128.5915'],

    -- 달성군 (다사, 옥포 상권)
    ARRAY['다사 이마트 옆 상가', '달성군', '다사읍', '달구벌대로 789', '35.8695', '128.4485'],
    ARRAY['옥포읍 상가', '달성군', '옥포읍', '옥포로 15', '35.7895', '128.3975'],
    ARRAY['화원읍 상가', '달성군', '화원읍', '비슬로 3060', '35.8095', '128.4875'],
    ARRAY['현풍 테크노폴리스 상가', '달성군', '현풍읍', '테크노대로 6', '35.7495', '128.4195'],
    ARRAY['논공읍 상가', '달성군', '논공읍', '논공로 17', '35.7595', '128.4675'],
    ARRAY['유가읍 상가', '달성군', '유가읍', '테크노대로 287', '35.7365', '128.4325']
  ];

  property_types TEXT[] := ARRAY['store', 'office', 'store'];
  transaction_types TEXT[] := ARRAY['rent_monthly', 'rent_monthly', 'rent_monthly', 'rent_yearly', 'sale'];
  business_types TEXT[] := ARRAY['음식점', '카페', '소매업', '서비스업', '학원', '병원', '사무실', '기타'];
  tags TEXT[] := ARRAY['역세권', '대로변', '코너', '1층', '신축', '리모델링', '무권리', '저권리', '주차가능', '엘리베이터'];

  loc TEXT[];
  prop_type TEXT;
  trans_type TEXT;
  deposit_val DECIMAL;
  monthly_rent_val DECIMAL;
  exclusive_area_val DECIMAL;
  floor_current_val INTEGER;
  floor_total_val INTEGER;

BEGIN
  FOR i IN 1..array_length(locations, 1) LOOP
    loc := locations[i];
    prop_type := property_types[1 + floor(random() * array_length(property_types, 1))::int];
    trans_type := transaction_types[1 + floor(random() * array_length(transaction_types, 1))::int];

    -- 가격 설정 (지역별 시세 반영)
    IF loc[2] = '수성구' THEN
      deposit_val := (3000 + floor(random() * 7000)::int) * 10000; -- 3000~10000만원
      monthly_rent_val := (150 + floor(random() * 350)::int) * 10000; -- 150~500만원
    ELSIF loc[2] = '중구' THEN
      deposit_val := (5000 + floor(random() * 15000)::int) * 10000; -- 5000~20000만원
      monthly_rent_val := (200 + floor(random() * 500)::int) * 10000; -- 200~700만원
    ELSE
      deposit_val := (1000 + floor(random() * 4000)::int) * 10000; -- 1000~5000만원
      monthly_rent_val := (80 + floor(random() * 220)::int) * 10000; -- 80~300만원
    END IF;

    exclusive_area_val := 10 + floor(random() * 50)::int;
    floor_current_val := 1 + floor(random() * 5)::int;
    floor_total_val := floor_current_val + floor(random() * 10)::int;

    -- 매물 삽입
    INSERT INTO public.properties (
      title,
      description,
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
      loc[1],
      loc[1] || ' - 대구 ' || loc[2] || ' ' || loc[3] || ' 위치. 유동인구 많은 상권입니다.',
      prop_type,
      trans_type,
      loc[2],
      loc[3],
      loc[4],
      floor_current_val || '층',
      loc[5]::DECIMAL,
      loc[6]::DECIMAL,
      CASE WHEN trans_type != 'sale' THEN deposit_val ELSE NULL END,
      CASE WHEN trans_type = 'rent_monthly' THEN monthly_rent_val ELSE NULL END,
      CASE WHEN trans_type = 'rent_yearly' THEN deposit_val * 1.5 ELSE NULL END,
      CASE WHEN trans_type = 'sale' THEN deposit_val * 20 ELSE NULL END,
      (floor(random() * 5000)::int) * 10000,
      (5 + floor(random() * 15)::int) * 10000,
      random() < 0.3,
      exclusive_area_val,
      exclusive_area_val * 1.3,
      floor_current_val,
      floor_total_val,
      CURRENT_DATE - (floor(random() * 3650)::int || ' days')::interval,
      floor_total_val > 3,
      random() < 0.6,
      random() < 0.5,
      TRUE,
      random() < 0.15,
      'available',
      (
        SELECT array_agg(bt)
        FROM (
          SELECT business_types[1 + floor(random() * array_length(business_types, 1))::int] as bt
          FROM generate_series(1, 2 + floor(random() * 3)::int)
        ) sub
      )
    )
    RETURNING id INTO property_id;

    -- 카카오 지도 정적 이미지 URL 생성 (로드뷰 대신 일반 지도 이미지 사용)
    -- 실제로는 카카오 정적 지도 API 사용: https://apis.map.kakao.com/web/documentation/#StaticMap
    INSERT INTO public.property_images (property_id, image_url, image_alt, is_main, display_order)
    VALUES (
      property_id,
      'https://map.kakao.com/link/map/' || loc[1] || ',' || loc[5] || ',' || loc[6],
      loc[1] || ' 위치 이미지',
      TRUE,
      0
    );

    -- 태그 삽입 (2-4개)
    FOR j IN 1..(2 + floor(random() * 3)::int) LOOP
      INSERT INTO public.property_tags (property_id, tag)
      VALUES (
        property_id,
        tags[1 + floor(random() * array_length(tags, 1))::int]
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- 진행상황 출력
    RAISE NOTICE '생성 완료: % (%.0f%%)', loc[1], (i::decimal / array_length(locations, 1) * 100);
  END LOOP;

  RAISE NOTICE '✅ 대구 지역 샘플 데이터 %개 생성 완료!', array_length(locations, 1);
END $$;

-- 임시 함수 삭제
DROP FUNCTION IF EXISTS random_between(DECIMAL, DECIMAL);
