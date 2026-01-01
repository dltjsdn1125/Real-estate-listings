# 샘플 데이터 생성 오류 해결 가이드

## 문제

`created_by` 컬럼이 NOT NULL 제약 조건이 있어서 샘플 데이터 생성 시 오류가 발생합니다.

## 해결 방법

Supabase 대시보드에서 다음 SQL을 실행하여 `created_by` 컬럼을 nullable로 변경하세요:

### 1. Supabase 대시보드 접속

[Supabase SQL Editor](https://supabase.com/dashboard/project/jnpxwcmshukhkxdzicwv/sql/new) 접속

### 2. SQL 실행

```sql
-- properties 테이블의 created_by 컬럼을 nullable로 변경
ALTER TABLE public.properties ALTER COLUMN created_by DROP NOT NULL;
```

### 3. 확인

SQL 실행 후 다음 명령어로 확인할 수 있습니다:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties' 
  AND column_name = 'created_by';
```

`is_nullable`이 `YES`로 표시되어야 합니다.

### 4. 샘플 데이터 생성 재시도

```bash
npm run seed
```

## 참고

- 이 변경은 샘플 데이터 생성 시에만 필요합니다.
- 실제 운영 환경에서는 `created_by`가 NOT NULL인 것이 정상입니다.
- 샘플 데이터 생성 후에는 다시 NOT NULL로 변경해도 됩니다 (선택사항):

```sql
-- 선택사항: 다시 NOT NULL로 변경
ALTER TABLE public.properties ALTER COLUMN created_by SET NOT NULL;
```

