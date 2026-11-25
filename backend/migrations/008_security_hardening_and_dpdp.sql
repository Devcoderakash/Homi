-- Migration 008: Security Hardening, Privilege Escalation Prevention & DPDP Act 2023 Compliance
-- HOMI Platform: Security & Privacy Infrastructure
-- Description: 
--   1. Hardens public.handle_new_user() trigger to prevent role escalation via client metadata.
--   2. Adds public.privacy_consents table to log user consent under DPDP Act 2023.
--   3. Adds public.data_subject_requests table for Right to Access, Correction, Erasure & Grievances.
--   4. Adds public.grievance_officers table for configurable Data Protection / Grievance Officer details.
--   5. Implements RLS policies for all new privacy and grievance tables.
--   6. Ensures storage buckets for worker documents and payment proofs are strictly private.

BEGIN;

-- ============================================================
-- 1. Prevent Privilege Escalation in Supabase Auth Sync Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role VARCHAR(20) := 'customer';
BEGIN
  -- Security Hardening: Only accept admin role if explicitly provisioned in raw_app_meta_data
  -- (raw_user_meta_data is client-supplied and MUST NEVER be trusted for role elevation)
  IF NEW.raw_app_meta_data IS NOT NULL AND LOWER(COALESCE(NEW.raw_app_meta_data->>'role', '')) = 'admin' THEN
    v_role := 'admin';
  END IF;

  INSERT INTO public.users (
    supabase_id, 
    name, 
    email, 
    phone, 
    role, 
    password_hash, 
    created_at, 
    updated_at
  ) VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    v_role,
    'SUPABASE_MANAGED_AUTH',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
  SET supabase_id = EXCLUDED.supabase_id,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. DPDP Act 2023: Consent Recording Table (privacy_consents)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.privacy_consents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    session_id VARCHAR(120),
    consent_type VARCHAR(60) NOT NULL,
    purpose TEXT NOT NULL,
    consent_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    granted BOOLEAN NOT NULL DEFAULT true,
    ip_address VARCHAR(45),
    user_agent TEXT,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_privacy_consents_user ON public.privacy_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_type ON public.privacy_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_session ON public.privacy_consents(session_id);


-- ============================================================
-- 3. DPDP Act 2023: Data Subject Requests (data_subject_requests)
-- Supports Right to Access, Correction, Erasure and Grievance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    request_type VARCHAR(40) NOT NULL, -- ACCESS, CORRECTION, ERASURE, GRIEVANCE
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(40),
    details TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_REVIEW, RESOLVED, REJECTED
    resolution_notes TEXT,
    resolved_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsr_user ON public.data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON public.data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_type ON public.data_subject_requests(request_type);


-- ============================================================
-- 4. Grievance Officer Configuration Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grievance_officers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL DEFAULT 'Grievance Redressal Officer',
    designation VARCHAR(120) NOT NULL DEFAULT 'Data Protection & Grievance Officer',
    email VARCHAR(255) NOT NULL DEFAULT 'grievance@homi.local',
    phone VARCHAR(40) NOT NULL DEFAULT '+91 755 000 0000',
    address TEXT NOT NULL DEFAULT 'Homi Platform Operations, Arera Colony, Bhopal, Madhya Pradesh - 462016, India',
    instructions TEXT NOT NULL DEFAULT 'Complaints will be acknowledged within 24 hours and resolved within 15 days in accordance with the Digital Personal Data Protection Act, 2023.',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default grievance officer record if empty
INSERT INTO public.grievance_officers (id, name, designation, email, phone, address, instructions, updated_at)
VALUES (
    1,
    'Grievance Redressal Officer',
    'Data Protection & Grievance Officer',
    'grievance@homi.local',
    '+91 755 000 0000',
    'Homi Platform Operations, Arera Colony, Bhopal, Madhya Pradesh - 462016, India',
    'Complaints will be acknowledged within 24 hours and resolved within 15 days in accordance with the Digital Personal Data Protection Act, 2023.',
    NOW()
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. Row Level Security Policies for Privacy Tables
-- ============================================================
ALTER TABLE public.privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_officers ENABLE ROW LEVEL SECURITY;

-- privacy_consents policies
DROP POLICY IF EXISTS "privacy_consents_insert" ON public.privacy_consents;
CREATE POLICY "privacy_consents_insert" ON public.privacy_consents
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "privacy_consents_select_own" ON public.privacy_consents;
CREATE POLICY "privacy_consents_select_own" ON public.privacy_consents
    FOR SELECT TO authenticated
    USING (user_id = public.current_user_id() OR public.is_admin());

DROP POLICY IF EXISTS "privacy_consents_admin_all" ON public.privacy_consents;
CREATE POLICY "privacy_consents_admin_all" ON public.privacy_consents
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- data_subject_requests policies
DROP POLICY IF EXISTS "dsr_insert" ON public.data_subject_requests;
CREATE POLICY "dsr_insert" ON public.data_subject_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "dsr_select_own" ON public.data_subject_requests;
CREATE POLICY "dsr_select_own" ON public.data_subject_requests
    FOR SELECT TO authenticated
    USING (user_id = public.current_user_id() OR public.is_admin());

DROP POLICY IF EXISTS "dsr_admin_all" ON public.data_subject_requests;
CREATE POLICY "dsr_admin_all" ON public.data_subject_requests
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- grievance_officers policies (Public read, admin manage)
DROP POLICY IF EXISTS "grievance_officers_select_public" ON public.grievance_officers;
CREATE POLICY "grievance_officers_select_public" ON public.grievance_officers
    FOR SELECT TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "grievance_officers_admin_manage" ON public.grievance_officers;
CREATE POLICY "grievance_officers_admin_manage" ON public.grievance_officers
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- ============================================================
-- 6. Storage Buckets Privacy Enforcement
-- Enforce that worker-documents and payment-proofs are strictly private
-- ============================================================
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('worker-documents', 'payment-proofs');

COMMIT;
