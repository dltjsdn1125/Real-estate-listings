-- Storage 버킷 및 정책 설정

-- 1. property-images 버킷 생성 (Supabase Dashboard에서 수동으로 생성 필요)
-- Bucket name: property-images
-- Public: true

-- 2. Storage RLS 정책 설정

-- 모든 사용자는 공개 이미지 조회 가능
CREATE POLICY "Anyone can view public property images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');

-- Agent와 Admin은 이미지 업로드 가능
CREATE POLICY "Agents can upload property images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('agent', 'admin')
      AND approval_status = 'approved'
    )
  );

-- Agent는 자신이 업로드한 이미지만 삭제 가능, Admin은 모든 이미지 삭제 가능
CREATE POLICY "Agents can delete own property images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- Agent는 자신이 업로드한 이미지만 수정 가능, Admin은 모든 이미지 수정 가능
CREATE POLICY "Agents can update own property images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'property-images'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

COMMENT ON POLICY "Anyone can view public property images" ON storage.objects IS '모든 사용자는 매물 이미지 조회 가능';
COMMENT ON POLICY "Agents can upload property images" ON storage.objects IS 'Agent와 Admin은 이미지 업로드 가능';
COMMENT ON POLICY "Agents can delete own property images" ON storage.objects IS 'Agent는 자신의 이미지만 삭제 가능';
COMMENT ON POLICY "Agents can update own property images" ON storage.objects IS 'Agent는 자신의 이미지만 수정 가능';

