-- 대구 실제 상가 샘플 데이터 50개 (간단 버전)
-- Supabase SQL Editor에서 직접 실행 가능

-- 1. 중구 - 대구백화점 프라자
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('대구백화점 프라자 1층 32평', '대구백화점 프라자 - 대구광역시 중구 명덕로 9 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '동성동2가', '대구광역시 중구 명덕로 9', '1층', 35.8669, 128.5950, 100000000, 5000000, 50000000, 200000, 32, 38.4, 1, 8, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '소매업']);

-- 2. 중구 - 현대백화점 대구점
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('현대백화점 대구점 2층 45평', '현대백화점 대구점 - 대구광역시 중구 달구벌대로 2077 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '계산동2가', '대구광역시 중구 달구벌대로 2077', '2층', 35.8682, 128.5928, 150000000, 7000000, 80000000, 300000, 45, 54, 2, 12, true, true, false, true, true, 'available', ARRAY['소매업', '서비스업']);

-- 3. 중구 - 동아쇼핑센터
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('동아쇼핑센터 1층 28평', '동아쇼핑센터 - 대구광역시 중구 동성로2길 49 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '동성동1가', '대구광역시 중구 동성로2길 49', '1층', 35.8695, 128.5963, 80000000, 4000000, 30000000, 180000, 28, 33.6, 1, 6, true, false, true, true, false, 'available', ARRAY['음식점', '카페']);

-- 4. 중구 - 동성로 엔젤리너스 빌딩
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('동성로 엔젤리너스 빌딩 1층 22평', '동성로 엔젤리너스 빌딩 - 대구광역시 중구 동성로 50 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '동성동1가', '대구광역시 중구 동성로 50', '1층', 35.8693, 128.5957, 70000000, 3500000, 20000000, 150000, 22, 26.4, 1, 5, true, false, true, true, false, 'available', ARRAY['카페', '소매업']);

-- 5. 중구 - 반월당 롯데영플라자
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('반월당 롯데영플라자 3층 55평', '반월당 롯데영플라자 - 대구광역시 중구 중앙대로 412 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '공평동', '대구광역시 중구 중앙대로 412', '3층', 35.8661, 128.5925, 120000000, 6000000, 60000000, 250000, 55, 66, 3, 10, true, true, true, true, true, 'available', ARRAY['소매업', '서비스업', '미용실']);

-- 6. 중구 - 서문시장 1지구
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('서문시장 1지구 1층 18평', '서문시장 1지구 - 대구광역시 중구 큰장로 26길 45 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '대신동', '대구광역시 중구 큰장로 26길 45', '1층', 35.8697, 128.5802, 30000000, 1500000, 10000000, 100000, 18, 21.6, 1, 3, false, false, true, true, false, 'available', ARRAY['소매업']);

-- 7. 중구 - 서문시장 2지구
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('서문시장 2지구 1층 15평', '서문시장 2지구 - 대구광역시 중구 달성로 35 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '대신동', '대구광역시 중구 달성로 35', '1층', 35.8705, 128.5815, 25000000, 1200000, 8000000, 80000, 15, 18, 1, 2, false, false, true, true, false, 'available', ARRAY['소매업', '음식점']);

-- 8. 중구 - 약령시장 한약상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('약령시장 한약상가 1층 20평', '약령시장 한약상가 - 대구광역시 중구 남성로 51 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '남성로', '대구광역시 중구 남성로 51', '1층', 35.8689, 128.5875, 40000000, 2000000, 15000000, 120000, 20, 24, 1, 4, false, false, true, true, false, 'available', ARRAY['약국', '서비스업']);

-- 9. 수성구 - 범어네거리 코오롱빌딩
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('범어네거리 코오롱빌딩 5층 60평', '범어네거리 코오롱빌딩 - 대구광역시 수성구 동대구로 325 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'office', 'rent_monthly', '수성구', '범어동', '대구광역시 수성구 동대구로 325', '5층', 35.8589, 128.6293, 80000000, 4500000, 30000000, 200000, 60, 72, 5, 15, true, true, true, true, true, 'available', ARRAY['사무실', '서비스업']);

-- 10. 수성구 - 만촌역 메트로상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('만촌역 메트로상가 1층 25평', '만촌역 메트로상가 - 대구광역시 수성구 만촌로 39 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'store', 'rent_monthly', '수성구', '만촌동', '대구광역시 수성구 만촌로 39', '1층', 35.8445, 128.6328, 60000000, 3000000, 25000000, 150000, 25, 30, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 11. 수성구 - 수성유원지 카페거리상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('수성유원지 카페거리상가 1층 35평', '수성유원지 카페거리상가 - 대구광역시 수성구 용학로 200 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'store', 'rent_monthly', '수성구', '두산동', '대구광역시 수성구 용학로 200', '1층', 35.8315, 128.6175, 70000000, 3500000, 40000000, 180000, 35, 42, 1, 3, false, true, true, true, false, 'available', ARRAY['카페', '음식점']);

-- 12. 수성구 - 들안길 먹거리타운
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('들안길 먹거리타운 1층 30평', '들안길 먹거리타운 - 대구광역시 수성구 들안로 87 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'store', 'rent_monthly', '수성구', '범어동', '대구광역시 수성구 들안로 87', '1층', 35.8525, 128.6215, 55000000, 2800000, 35000000, 160000, 30, 36, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점']);

-- 13. 수성구 - 황금네거리 대백프라자
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('황금네거리 대백프라자 2층 40평', '황금네거리 대백프라자 - 대구광역시 수성구 달구벌대로 2420 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'store', 'rent_monthly', '수성구', '황금동', '대구광역시 수성구 달구벌대로 2420', '2층', 35.8495, 128.6375, 65000000, 3200000, 30000000, 170000, 40, 48, 2, 8, true, true, false, true, false, 'available', ARRAY['소매업', '서비스업', '미용실']);

-- 14. 수성구 - 범어역 엑스코상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('범어역 엑스코상가 1층 38평', '범어역 엑스코상가 - 대구광역시 수성구 범어로 155 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'store', 'rent_monthly', '수성구', '범어동', '대구광역시 수성구 범어로 155', '1층', 35.8565, 128.6245, 75000000, 4000000, 45000000, 190000, 38, 45.6, 1, 10, true, true, true, true, true, 'available', ARRAY['음식점', '카페', '소매업']);

-- 15. 달서구 - 성서공단 테크노폴리스몰
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('성서공단 테크노폴리스몰 1층 50평', '성서공단 테크노폴리스몰 - 대구광역시 달서구 성서공단로 11길 62 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '호림동', '대구광역시 달서구 성서공단로 11길 62', '1층', 35.8365, 128.5185, 40000000, 2000000, 10000000, 150000, 50, 60, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '편의점']);

-- 16. 달서구 - 월성동 로데오거리 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('월성동 로데오거리 상가 1층 28평', '월성동 로데오거리 상가 - 대구광역시 달서구 월배로 251 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '월성동', '대구광역시 달서구 월배로 251', '1층', 35.8195, 128.5485, 35000000, 1800000, 15000000, 120000, 28, 33.6, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '카페', '미용실']);

-- 17. 달서구 - 계명대 정문 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('계명대 정문 상가 1층 22평', '계명대 정문 상가 - 대구광역시 달서구 달구벌대로 1095 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '신당동', '대구광역시 달서구 달구벌대로 1095', '1층', 35.8545, 128.4875, 25000000, 1200000, 8000000, 100000, 22, 26.4, 1, 3, false, false, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 18. 달서구 - 이곡동 홈플러스 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('이곡동 홈플러스 상가 2층 35평', '이곡동 홈플러스 상가 - 대구광역시 달서구 달구벌대로 1245 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '이곡동', '대구광역시 달서구 달구벌대로 1245', '2층', 35.8495, 128.5345, 30000000, 1500000, 12000000, 110000, 35, 42, 2, 6, true, true, true, true, false, 'available', ARRAY['학원', '서비스업']);

-- 19. 달서구 - 죽전역 역세권 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('죽전역 역세권 상가 1층 30평', '죽전역 역세권 상가 - 대구광역시 달서구 달구벌대로 1465 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '죽전동', '대구광역시 달서구 달구벌대로 1465', '1층', 35.8495, 128.5095, 45000000, 2200000, 18000000, 140000, 30, 36, 1, 7, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 20. 북구 - 칠성시장 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('칠성시장 상가 1층 15평', '칠성시장 상가 - 대구광역시 북구 칠성로 123 소재. 대학가/시장 인근, 안정적인 상권', 'store', 'rent_monthly', '북구', '칠성동1가', '대구광역시 북구 칠성로 123', '1층', 35.8855, 128.5925, 20000000, 1000000, 5000000, 80000, 15, 18, 1, 2, false, false, true, true, false, 'available', ARRAY['소매업', '음식점']);

-- 21. 북구 - 경북대학교 북문 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('경북대학교 북문 상가 1층 20평', '경북대학교 북문 상가 - 대구광역시 북구 대학로 80 소재. 대학가/시장 인근, 안정적인 상권', 'store', 'rent_monthly', '북구', '복현동', '대구광역시 북구 대학로 80', '1층', 35.8895, 128.6115, 25000000, 1200000, 8000000, 90000, 20, 24, 1, 3, false, false, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 22. 북구 - 팔달시장 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('팔달시장 상가 1층 18평', '팔달시장 상가 - 대구광역시 북구 칠곡중앙대로 289 소재. 대학가/시장 인근, 안정적인 상권', 'store', 'rent_monthly', '북구', '노원동3가', '대구광역시 북구 칠곡중앙대로 289', '1층', 35.9025, 128.5765, 18000000, 900000, 5000000, 70000, 18, 21.6, 1, 2, false, false, true, true, false, 'available', ARRAY['소매업']);

-- 23. 북구 - 침산네거리 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('침산네거리 상가 1층 25평', '침산네거리 상가 - 대구광역시 북구 침산로 95 소재. 대학가/시장 인근, 안정적인 상권', 'store', 'rent_monthly', '북구', '침산동', '대구광역시 북구 침산로 95', '1층', 35.8865, 128.5805, 30000000, 1500000, 10000000, 100000, 25, 30, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '서비스업']);

-- 24. 동구 - 동대구역 복합환승센터 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('동대구역 복합환승센터 상가 1층 40평', '동대구역 복합환승센터 상가 - 대구광역시 동구 동대구로 550 소재. 동대구역 역세권, 교통 요충지', 'store', 'rent_monthly', '동구', '신천동', '대구광역시 동구 동대구로 550', '1층', 35.8795, 128.6285, 60000000, 3000000, 25000000, 180000, 40, 48, 1, 10, true, true, true, true, true, 'available', ARRAY['음식점', '카페', '편의점']);

-- 25. 동구 - 신세계백화점 대구점
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('신세계백화점 대구점 3층 55평', '신세계백화점 대구점 - 대구광역시 동구 동부로 149 소재. 동대구역 역세권, 교통 요충지', 'store', 'rent_monthly', '동구', '신천동', '대구광역시 동구 동부로 149', '3층', 35.8765, 128.6315, 100000000, 5000000, 50000000, 250000, 55, 66, 3, 12, true, true, false, true, true, 'available', ARRAY['소매업', '서비스업']);

-- 26. 동구 - 대구혁신도시 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('대구혁신도시 상가 1층 45평', '대구혁신도시 상가 - 대구광역시 동구 이노밸리로 20 소재. 동대구역 역세권, 교통 요충지', 'store', 'rent_monthly', '동구', '신서동', '대구광역시 동구 이노밸리로 20', '1층', 35.8895, 128.6565, 50000000, 2500000, 20000000, 160000, 45, 54, 1, 8, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 27. 동구 - 아양교역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('아양교역 상가 1층 28평', '아양교역 상가 - 대구광역시 동구 아양로 205 소재. 동대구역 역세권, 교통 요충지', 'store', 'rent_monthly', '동구', '효목동', '대구광역시 동구 아양로 205', '1층', 35.8735, 128.6415, 35000000, 1800000, 12000000, 120000, 28, 33.6, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '소매업']);

-- 28. 서구 - 서대구역 역세권 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('서대구역 역세권 상가 1층 35평', '서대구역 역세권 상가 - 대구광역시 서구 국채보상로 707 소재. 서대구역 개발 호재, 미래가치 높음', 'store', 'rent_monthly', '서구', '평리동', '대구광역시 서구 국채보상로 707', '1층', 35.8665, 128.5565, 40000000, 2000000, 15000000, 130000, 35, 42, 1, 6, true, true, true, true, false, 'available', ARRAY['음식점', '카페']);

-- 29. 서구 - 비산네거리 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('비산네거리 상가 1층 25평', '비산네거리 상가 - 대구광역시 서구 달서로 115 소재. 서대구역 개발 호재, 미래가치 높음', 'store', 'rent_monthly', '서구', '비산동', '대구광역시 서구 달서로 115', '1층', 35.8685, 128.5475, 30000000, 1500000, 10000000, 100000, 25, 30, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '소매업']);

-- 30. 서구 - 내당역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('내당역 상가 1층 22평', '내당역 상가 - 대구광역시 서구 국채보상로 543 소재. 서대구역 개발 호재, 미래가치 높음', 'store', 'rent_monthly', '서구', '내당동', '대구광역시 서구 국채보상로 543', '1층', 35.8635, 128.5615, 28000000, 1400000, 8000000, 90000, 22, 26.4, 1, 5, true, false, true, true, false, 'available', ARRAY['카페', '편의점']);

-- 31. 남구 - 대명역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('대명역 상가 1층 30평', '대명역 상가 - 대구광역시 남구 대명로 150 소재. 대명/앞산 인근, 주거밀집 상권', 'store', 'rent_monthly', '남구', '대명동', '대구광역시 남구 대명로 150', '1층', 35.8495, 128.5785, 35000000, 1800000, 12000000, 120000, 30, 36, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '카페']);

-- 32. 남구 - 앞산순환로 카페거리
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('앞산순환로 카페거리 1층 40평', '앞산순환로 카페거리 - 대구광역시 남구 앞산순환로 1 소재. 대명/앞산 인근, 주거밀집 상권', 'store', 'rent_monthly', '남구', '대명동', '대구광역시 남구 앞산순환로 1', '1층', 35.8295, 128.5825, 45000000, 2200000, 20000000, 150000, 40, 48, 1, 3, false, true, true, true, false, 'available', ARRAY['카페']);

-- 33. 남구 - 영남대의료원 앞 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('영남대의료원 앞 상가 1층 25평', '영남대의료원 앞 상가 - 대구광역시 남구 현충로 170 소재. 대명/앞산 인근, 주거밀집 상권', 'store', 'rent_monthly', '남구', '대명동', '대구광역시 남구 현충로 170', '1층', 35.8465, 128.5745, 30000000, 1500000, 10000000, 100000, 25, 30, 1, 4, false, true, true, true, false, 'available', ARRAY['약국', '편의점', '음식점']);

-- 34. 남구 - 봉덕시장 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('봉덕시장 상가 1층 18평', '봉덕시장 상가 - 대구광역시 남구 봉덕로 87 소재. 대명/앞산 인근, 주거밀집 상권', 'store', 'rent_monthly', '남구', '봉덕동', '대구광역시 남구 봉덕로 87', '1층', 35.8495, 128.5855, 20000000, 1000000, 5000000, 70000, 18, 21.6, 1, 2, false, false, true, true, false, 'available', ARRAY['소매업']);

-- 35. 달성군 - 다사읍 이마트 앞 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('다사읍 이마트 앞 상가 1층 35평', '다사읍 이마트 앞 상가 - 대구광역시 달성군 다사읍 달구벌대로 789 소재. 신규 개발지역, 성장 가능성 높음', 'store', 'rent_monthly', '달성군', '다사읍', '대구광역시 달성군 다사읍 달구벌대로 789', '1층', 35.8695, 128.4485, 30000000, 1500000, 10000000, 100000, 35, 42, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 36. 달성군 - 화원읍 자이아파트 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('화원읍 자이아파트 상가 1층 28평', '화원읍 자이아파트 상가 - 대구광역시 달성군 화원읍 비슬로 3060 소재. 신규 개발지역, 성장 가능성 높음', 'store', 'rent_monthly', '달성군', '화원읍', '대구광역시 달성군 화원읍 비슬로 3060', '1층', 35.8095, 128.4875, 25000000, 1200000, 8000000, 90000, 28, 33.6, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '편의점']);

-- 37. 달성군 - 현풍 테크노폴리스 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('현풍 테크노폴리스 상가 1층 45평', '현풍 테크노폴리스 상가 - 대구광역시 달성군 현풍읍 테크노대로 6 소재. 신규 개발지역, 성장 가능성 높음', 'store', 'rent_monthly', '달성군', '현풍읍', '대구광역시 달성군 현풍읍 테크노대로 6', '1층', 35.7495, 128.4195, 35000000, 1800000, 12000000, 120000, 45, 54, 1, 6, true, true, true, true, false, 'available', ARRAY['음식점', '카페']);

-- 38. 중구 - 동성로 영풍문고 빌딩
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('동성로 영풍문고 빌딩 2층 38평', '동성로 영풍문고 빌딩 - 대구광역시 중구 동성로 81 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '동성동1가', '대구광역시 중구 동성로 81', '2층', 35.8688, 128.5949, 90000000, 4500000, 40000000, 200000, 38, 45.6, 2, 7, true, false, true, true, false, 'available', ARRAY['학원', '서비스업']);

-- 39. 중구 - 교동시장 상가 A동
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('교동시장 상가 A동 1층 16평', '교동시장 상가 A동 - 대구광역시 중구 동성로 36 소재. 동성로/반월당 핵심 상권, 유동인구 최다 지역', 'store', 'rent_monthly', '중구', '교동', '대구광역시 중구 동성로 36', '1층', 35.8715, 128.5905, 22000000, 1100000, 6000000, 80000, 16, 19.2, 1, 2, false, false, true, true, false, 'available', ARRAY['소매업', '음식점']);

-- 40. 수성구 - 지산범물역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('지산범물역 상가 1층 32평', '지산범물역 상가 - 대구광역시 수성구 지범로 57 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'store', 'rent_monthly', '수성구', '지산동', '대구광역시 수성구 지범로 57', '1층', 35.8195, 128.6410, 55000000, 2800000, 30000000, 150000, 32, 38.4, 1, 6, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 41. 수성구 - 수성구청 인근 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('수성구청 인근 상가 2층 42평', '수성구청 인근 상가 - 대구광역시 수성구 수성로 283 소재. 수성구 프리미엄 상권, 구매력 높은 고객층', 'office', 'rent_monthly', '수성구', '범어동', '대구광역시 수성구 수성로 283', '2층', 35.8565, 128.6305, 60000000, 3000000, 25000000, 160000, 42, 50.4, 2, 8, true, true, false, true, false, 'available', ARRAY['사무실', '서비스업', '학원']);

-- 42. 달서구 - 본리동 영남네거리 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('본리동 영남네거리 상가 1층 26평', '본리동 영남네거리 상가 - 대구광역시 달서구 월배로 87 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '본리동', '대구광역시 달서구 월배로 87', '1층', 35.8295, 128.5585, 28000000, 1400000, 10000000, 100000, 26, 31.2, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '미용실']);

-- 43. 달서구 - 감삼역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('감삼역 상가 1층 30평', '감삼역 상가 - 대구광역시 달서구 달구벌대로 1405 소재. 성서/월배 신흥 상권, 젊은 유동인구 많음', 'store', 'rent_monthly', '달서구', '감삼동', '대구광역시 달서구 달구벌대로 1405', '1층', 35.8515, 128.5155, 38000000, 1900000, 15000000, 130000, 30, 36, 1, 6, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 44. 북구 - 대구공항 인근 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('대구공항 인근 상가 1층 35평', '대구공항 인근 상가 - 대구광역시 북구 동천로 55 소재. 대학가/시장 인근, 안정적인 상권', 'store', 'rent_monthly', '북구', '동천동', '대구광역시 북구 동천로 55', '1층', 35.8945, 128.6325, 32000000, 1600000, 12000000, 110000, 35, 42, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '편의점']);

-- 45. 북구 - 태전역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('태전역 상가 1층 28평', '태전역 상가 - 대구광역시 북구 태전로 25 소재. 대학가/시장 인근, 안정적인 상권', 'store', 'rent_monthly', '북구', '태전동', '대구광역시 북구 태전로 25', '1층', 35.8995, 128.5715, 28000000, 1400000, 10000000, 100000, 28, 33.6, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '카페']);

-- 46. 동구 - 동촌유원지 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('동촌유원지 상가 1층 32평', '동촌유원지 상가 - 대구광역시 동구 팔공로 297 소재. 동대구역 역세권, 교통 요충지', 'store', 'rent_monthly', '동구', '검사동', '대구광역시 동구 팔공로 297', '1층', 35.8925, 128.6475, 30000000, 1500000, 10000000, 100000, 32, 38.4, 1, 3, false, true, true, true, false, 'available', ARRAY['카페', '음식점']);

-- 47. 동구 - 율하역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('율하역 상가 1층 38평', '율하역 상가 - 대구광역시 동구 율하동로 23 소재. 동대구역 역세권, 교통 요충지', 'store', 'rent_monthly', '동구', '율하동', '대구광역시 동구 율하동로 23', '1층', 35.8825, 128.6685, 40000000, 2000000, 15000000, 130000, 38, 45.6, 1, 7, true, true, true, true, false, 'available', ARRAY['음식점', '카페', '편의점']);

-- 48. 서구 - 서구청 인근 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('서구청 인근 상가 1층 30평', '서구청 인근 상가 - 대구광역시 서구 국채보상로 257 소재. 서대구역 개발 호재, 미래가치 높음', 'store', 'rent_monthly', '서구', '비산동', '대구광역시 서구 국채보상로 257', '1층', 35.8715, 128.5525, 32000000, 1600000, 12000000, 110000, 30, 36, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '서비스업']);

-- 49. 남구 - 명덕역 상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('명덕역 상가 1층 24평', '명덕역 상가 - 대구광역시 남구 이천로 55 소재. 대명/앞산 인근, 주거밀집 상권', 'store', 'rent_monthly', '남구', '이천동', '대구광역시 남구 이천로 55', '1층', 35.8385, 128.5915, 28000000, 1400000, 10000000, 100000, 24, 28.8, 1, 5, true, true, true, true, false, 'available', ARRAY['음식점', '편의점']);

-- 50. 달성군 - 옥포읍 중심상가
INSERT INTO properties (title, description, property_type, transaction_type, district, dong, address, detail_address, latitude, longitude, deposit, monthly_rent, key_money, maintenance_fee, exclusive_area, contract_area, floor_current, floor_total, has_elevator, has_parking, immediate_move_in, is_public, is_premium, status, allowed_business_types)
VALUES ('옥포읍 중심상가 1층 30평', '옥포읍 중심상가 - 대구광역시 달성군 옥포읍 옥포로 15 소재. 신규 개발지역, 성장 가능성 높음', 'store', 'rent_monthly', '달성군', '옥포읍', '대구광역시 달성군 옥포읍 옥포로 15', '1층', 35.7895, 128.3975, 22000000, 1100000, 8000000, 80000, 30, 36, 1, 4, false, true, true, true, false, 'available', ARRAY['음식점', '소매업']);
