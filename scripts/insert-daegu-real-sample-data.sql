-- 대구 지역 실제 상가 샘플 데이터 50개 생성
-- 실제 존재하는 상가, 빌딩, 시장 기반 데이터

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
  j INTEGER;

  -- 대구 실제 상가/빌딩 정보 (이름, 구, 동, 도로명주소, 위도, 경도)
  locations TEXT[][] := ARRAY[
    -- 중구 동성로/반월당 상권 - 실제 빌딩 및 상가
    ARRAY['대구백화점 프라자', '중구', '동성동2가', '대구광역시 중구 명덕로 9', '35.8669', '128.5950'],
    ARRAY['현대백화점 대구점', '중구', '계산동2가', '대구광역시 중구 달구벌대로 2077', '35.8682', '128.5928'],
    ARRAY['동아쇼핑센터', '중구', '동성동1가', '대구광역시 중구 동성로2길 49', '35.8695', '128.5963'],
    ARRAY['동성로 엔젤리너스 빌딩', '중구', '동성동1가', '대구광역시 중구 동성로 50', '35.8693', '128.5957'],
    ARRAY['동성로 영풍문고 빌딩', '중구', '동성동1가', '대구광역시 중구 동성로 81', '35.8688', '128.5949'],
    ARRAY['반월당 롯데영플라자', '중구', '공평동', '대구광역시 중구 중앙대로 412', '35.8661', '128.5925'],
    ARRAY['교동시장 상가 A동', '중구', '교동', '대구광역시 중구 동성로 36', '35.8715', '128.5905'],
    ARRAY['약령시장 한약상가', '중구', '남성로', '대구광역시 중구 남성로 51', '35.8689', '128.5875'],
    ARRAY['서문시장 1지구', '중구', '대신동', '대구광역시 중구 큰장로 26길 45', '35.8697', '128.5802'],
    ARRAY['서문시장 2지구', '중구', '대신동', '대구광역시 중구 달성로 35', '35.8705', '128.5815'],

    -- 수성구 - 실제 상가
    ARRAY['범어네거리 코오롱빌딩', '수성구', '범어동', '대구광역시 수성구 동대구로 325', '35.8589', '128.6293'],
    ARRAY['만촌역 메트로상가', '수성구', '만촌동', '대구광역시 수성구 만촌로 39', '35.8445', '128.6328'],
    ARRAY['수성유원지 카페거리상가', '수성구', '두산동', '대구광역시 수성구 용학로 200', '35.8315', '128.6175'],
    ARRAY['들안길 먹거리타운', '수성구', '범어동', '대구광역시 수성구 들안로 87', '35.8525', '128.6215'],
    ARRAY['황금네거리 대백프라자', '수성구', '황금동', '대구광역시 수성구 달구벌대로 2420', '35.8495', '128.6375'],
    ARRAY['범어역 엑스코상가', '수성구', '범어동', '대구광역시 수성구 범어로 155', '35.8565', '128.6245'],
    ARRAY['지산범물역 상가', '수성구', '지산동', '대구광역시 수성구 지범로 57', '35.8195', '128.6410'],
    ARRAY['수성구청 인근 상가', '수성구', '범어동', '대구광역시 수성구 수성로 283', '35.8565', '128.6305'],

    -- 달서구 - 실제 상가
    ARRAY['성서공단 테크노폴리스몰', '달서구', '호림동', '대구광역시 달서구 성서공단로 11길 62', '35.8365', '128.5185'],
    ARRAY['월성동 로데오거리 상가', '달서구', '월성동', '대구광역시 달서구 월배로 251', '35.8195', '128.5485'],
    ARRAY['계명대 정문 상가', '달서구', '신당동', '대구광역시 달서구 달구벌대로 1095', '35.8545', '128.4875'],
    ARRAY['이곡동 홈플러스 상가', '달서구', '이곡동', '대구광역시 달서구 달구벌대로 1245', '35.8495', '128.5345'],
    ARRAY['본리동 영남네거리 상가', '달서구', '본리동', '대구광역시 달서구 월배로 87', '35.8295', '128.5585'],
    ARRAY['죽전역 역세권 상가', '달서구', '죽전동', '대구광역시 달서구 달구벌대로 1465', '35.8495', '128.5095'],
    ARRAY['감삼역 상가', '달서구', '감삼동', '대구광역시 달서구 달구벌대로 1405', '35.8515', '128.5155'],

    -- 북구 - 실제 상가
    ARRAY['칠성시장 상가', '북구', '칠성동1가', '대구광역시 북구 칠성로 123', '35.8855', '128.5925'],
    ARRAY['경북대학교 북문 상가', '북구', '복현동', '대구광역시 북구 대학로 80', '35.8895', '128.6115'],
    ARRAY['팔달시장 상가', '북구', '노원동3가', '대구광역시 북구 칠곡중앙대로 289', '35.9025', '128.5765'],
    ARRAY['대구공항 인근 상가', '북구', '동천동', '대구광역시 북구 동천로 55', '35.8945', '128.6325'],
    ARRAY['침산네거리 상가', '북구', '침산동', '대구광역시 북구 침산로 95', '35.8865', '128.5805'],
    ARRAY['태전역 상가', '북구', '태전동', '대구광역시 북구 태전로 25', '35.8995', '128.5715'],

    -- 동구 - 실제 상가
    ARRAY['동대구역 복합환승센터 상가', '동구', '신천동', '대구광역시 동구 동대구로 550', '35.8795', '128.6285'],
    ARRAY['신세계백화점 대구점', '동구', '신천동', '대구광역시 동구 동부로 149', '35.8765', '128.6315'],
    ARRAY['대구혁신도시 상가', '동구', '신서동', '대구광역시 동구 이노밸리로 20', '35.8895', '128.6565'],
    ARRAY['동촌유원지 상가', '동구', '검사동', '대구광역시 동구 팔공로 297', '35.8925', '128.6475'],
    ARRAY['아양교역 상가', '동구', '효목동', '대구광역시 동구 아양로 205', '35.8735', '128.6415'],
    ARRAY['율하역 상가', '동구', '율하동', '대구광역시 동구 율하동로 23', '35.8825', '128.6685'],

    -- 서구 - 실제 상가
    ARRAY['서대구역 역세권 상가', '서구', '평리동', '대구광역시 서구 국채보상로 707', '35.8665', '128.5565'],
    ARRAY['비산네거리 상가', '서구', '비산동', '대구광역시 서구 달서로 115', '35.8685', '128.5475'],
    ARRAY['서구청 인근 상가', '서구', '비산동', '대구광역시 서구 국채보상로 257', '35.8715', '128.5525'],
    ARRAY['내당역 상가', '서구', '내당동', '대구광역시 서구 국채보상로 543', '35.8635', '128.5615'],

    -- 남구 - 실제 상가
    ARRAY['대명역 상가', '남구', '대명동', '대구광역시 남구 대명로 150', '35.8495', '128.5785'],
    ARRAY['앞산순환로 카페거리', '남구', '대명동', '대구광역시 남구 앞산순환로 1', '35.8295', '128.5825'],
    ARRAY['영남대의료원 앞 상가', '남구', '대명동', '대구광역시 남구 현충로 170', '35.8465', '128.5745'],
    ARRAY['봉덕시장 상가', '남구', '봉덕동', '대구광역시 남구 봉덕로 87', '35.8495', '128.5855'],
    ARRAY['명덕역 상가', '남구', '이천동', '대구광역시 남구 이천로 55', '35.8385', '128.5915'],

    -- 달성군 - 실제 상가
    ARRAY['다사읍 이마트 앞 상가', '달성군', '다사읍', '대구광역시 달성군 다사읍 달구벌대로 789', '35.8695', '128.4485'],
    ARRAY['옥포읍 중심상가', '달성군', '옥포읍', '대구광역시 달성군 옥포읍 옥포로 15', '35.7895', '128.3975'],
    ARRAY['화원읍 자이아파트 상가', '달성군', '화원읍', '대구광역시 달성군 화원읍 비슬로 3060', '35.8095', '128.4875'],
    ARRAY['현풍 테크노폴리스 상가', '달성군', '현풍읍', '대구광역시 달성군 현풍읍 테크노대로 6', '35.7495', '128.4195'],
    ARRAY['유가읍 상가', '달성군', '유가읍', '대구광역시 달성군 유가읍 테크노대로 287', '35.7365', '128.4325']
  ];

  property_types TEXT[] := ARRAY['store', 'office', 'store'];
  transaction_types TEXT[] := ARRAY['rent_monthly', 'rent_monthly', 'rent_monthly', 'rent_yearly', 'sale'];
  business_types TEXT[] := ARRAY['음식점', '카페', '소매업', '서비스업', '학원', '병원', '사무실', '미용실', '편의점', '약국'];
  tags TEXT[] := ARRAY['역세권', '대로변', '코너', '1층', '신축', '리모델링', '무권리', '저권리', '주차가능', '엘리베이터', '유동인구많음', '대단지아파트인근'];

  loc TEXT[];
  prop_type TEXT;
  trans_type TEXT;
  deposit_val DECIMAL;
  monthly_rent_val DECIMAL;
  exclusive_area_val DECIMAL;
  floor_current_val INTEGER;
  floor_total_val INTEGER;
  key_money_val DECIMAL;

BEGIN
  FOR i IN 1..array_length(locations, 1) LOOP
    loc := locations[i];
    prop_type := property_types[1 + floor(random() * array_length(property_types, 1))::int];
    trans_type := transaction_types[1 + floor(random() * array_length(transaction_types, 1))::int];

    -- 지역별 시세 반영
    IF loc[2] = '수성구' THEN
      deposit_val := (3000 + floor(random() * 7000)::int) * 10000;
      monthly_rent_val := (150 + floor(random() * 350)::int) * 10000;
      key_money_val := (1000 + floor(random() * 4000)::int) * 10000;
    ELSIF loc[2] = '중구' THEN
      deposit_val := (5000 + floor(random() * 15000)::int) * 10000;
      monthly_rent_val := (200 + floor(random() * 500)::int) * 10000;
      key_money_val := (2000 + floor(random() * 8000)::int) * 10000;
    ELSIF loc[2] = '동구' THEN
      deposit_val := (2000 + floor(random() * 5000)::int) * 10000;
      monthly_rent_val := (100 + floor(random() * 200)::int) * 10000;
      key_money_val := (500 + floor(random() * 3000)::int) * 10000;
    ELSE
      deposit_val := (1000 + floor(random() * 4000)::int) * 10000;
      monthly_rent_val := (80 + floor(random() * 220)::int) * 10000;
      key_money_val := (0 + floor(random() * 2000)::int) * 10000;
    END IF;

    exclusive_area_val := 15 + floor(random() * 85)::int;
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
      loc[1] || ' ' || floor_current_val || '층 ' || exclusive_area_val::int || '평',
      loc[1] || ' - ' || loc[4] || ' 소재. ' ||
      CASE
        WHEN loc[2] = '중구' THEN '동성로/반월당 핵심 상권, 유동인구 최다 지역'
        WHEN loc[2] = '수성구' THEN '수성구 프리미엄 상권, 구매력 높은 고객층'
        WHEN loc[2] = '달서구' THEN '성서/월배 신흥 상권, 젊은 유동인구 많음'
        WHEN loc[2] = '북구' THEN '대학가/시장 인근, 안정적인 상권'
        WHEN loc[2] = '동구' THEN '동대구역 역세권, 교통 요충지'
        WHEN loc[2] = '서구' THEN '서대구역 개발 호재, 미래가치 높음'
        WHEN loc[2] = '남구' THEN '대명/앞산 인근, 주거밀집 상권'
        ELSE '신규 개발지역, 성장 가능성 높음'
      END,
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
      CASE WHEN trans_type = 'rent_yearly' THEN deposit_val * 1.2 ELSE NULL END,
      CASE WHEN trans_type = 'sale' THEN deposit_val * 15 ELSE NULL END,
      key_money_val,
      (10 + floor(random() * 20)::int) * 10000,
      random() < 0.3,
      exclusive_area_val,
      exclusive_area_val * 1.2,
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
        SELECT array_agg(DISTINCT bt)
        FROM (
          SELECT business_types[1 + floor(random() * array_length(business_types, 1))::int] as bt
          FROM generate_series(1, 2 + floor(random() * 3)::int)
        ) sub
      )
    )
    RETURNING id INTO property_id;

    -- 카카오 지도 정적 이미지 (실제 좌표 기반)
    INSERT INTO public.property_images (property_id, image_url, image_alt, is_main, display_order)
    VALUES (
      property_id,
      'https://dapi.kakao.com/v2/maps/staticmap?appkey=' ||
      (SELECT current_setting('app.kakao_api_key', true)) ||
      '&center=' || loc[6] || ',' || loc[5] ||
      '&level=3&size=640x480&format=png',
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

    RAISE NOTICE '생성 완료: % (%.0f%%)', loc[1], (i::decimal / array_length(locations, 1) * 100);
  END LOOP;

  RAISE NOTICE '✅ 대구 지역 실제 상가 기반 샘플 데이터 %개 생성 완료!', array_length(locations, 1);
END $$;

-- 임시 함수 삭제
DROP FUNCTION IF EXISTS random_between(DECIMAL, DECIMAL);
