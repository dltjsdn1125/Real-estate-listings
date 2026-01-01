-- Row Level Security (RLS) 정책 설정

-- ============================================
-- 1. users 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정 가능 (role, tier, approval_status 제외)
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND tier = (SELECT tier FROM public.users WHERE id = auth.uid())
    AND approval_status = (SELECT approval_status FROM public.users WHERE id = auth.uid())
  );

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 관리자는 모든 사용자 수정 가능
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- 2. properties 테이블 RLS 정책
-- ============================================

-- 모든 사용자는 공개 매물 조회 가능
CREATE POLICY "Anyone can view public properties"
  ON public.properties
  FOR SELECT
  USING (is_public = TRUE AND status = 'available');

-- 인증된 사용자는 모든 공개 매물 조회 가능
CREATE POLICY "Authenticated users can view all public properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (is_public = TRUE);

-- Agent와 Admin은 자신이 등록한 매물 조회 가능
CREATE POLICY "Agents can view own properties"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('agent', 'admin')
    )
  );

-- Agent와 Admin은 매물 등록 가능
CREATE POLICY "Agents and admins can insert properties"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('agent', 'admin')
      AND approval_status = 'approved'
    )
  );

-- Agent는 자신의 매물만 수정 가능, Admin은 모든 매물 수정 가능
CREATE POLICY "Agents can update own properties"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin만 매물 삭제 가능
CREATE POLICY "Only admins can delete properties"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- 3. property_images 테이블 RLS 정책
-- ============================================

-- 모든 사용자는 공개 매물의 이미지 조회 가능
CREATE POLICY "Anyone can view public property images"
  ON public.property_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_images.property_id
      AND is_public = TRUE
    )
  );

-- Agent와 Admin은 매물 이미지 추가 가능
CREATE POLICY "Agents can insert property images"
  ON public.property_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = property_images.property_id
      AND (p.created_by = auth.uid() OR u.role = 'admin')
    )
  );

-- Agent는 자신의 매물 이미지만 삭제 가능, Admin은 모든 이미지 삭제 가능
CREATE POLICY "Agents can delete own property images"
  ON public.property_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = property_images.property_id
      AND (p.created_by = auth.uid() OR u.role = 'admin')
    )
  );

-- ============================================
-- 4. property_tags 테이블 RLS 정책
-- ============================================

-- 모든 사용자는 공개 매물의 태그 조회 가능
CREATE POLICY "Anyone can view public property tags"
  ON public.property_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE id = property_tags.property_id
      AND is_public = TRUE
    )
  );

-- Agent와 Admin은 매물 태그 추가 가능
CREATE POLICY "Agents can insert property tags"
  ON public.property_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = property_tags.property_id
      AND (p.created_by = auth.uid() OR u.role = 'admin')
    )
  );

-- Agent는 자신의 매물 태그만 삭제 가능, Admin은 모든 태그 삭제 가능
CREATE POLICY "Agents can delete own property tags"
  ON public.property_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      JOIN public.users u ON u.id = auth.uid()
      WHERE p.id = property_tags.property_id
      AND (p.created_by = auth.uid() OR u.role = 'admin')
    )
  );

-- ============================================
-- 5. audit_logs 테이블 RLS 정책
-- ============================================

-- Admin만 감사 로그 조회 가능
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 시스템만 감사 로그 추가 가능 (트리거 사용)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ============================================
-- 6. partner_info 테이블 RLS 정책
-- ============================================

-- 사용자는 자신의 파트너 정보만 조회 가능
CREATE POLICY "Users can view own partner info"
  ON public.partner_info
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin은 모든 파트너 정보 조회 가능
CREATE POLICY "Admins can view all partner info"
  ON public.partner_info
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- 사용자는 자신의 파트너 정보만 추가/수정 가능
CREATE POLICY "Users can manage own partner info"
  ON public.partner_info
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin은 모든 파트너 정보 수정 가능
CREATE POLICY "Admins can manage all partner info"
  ON public.partner_info
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

