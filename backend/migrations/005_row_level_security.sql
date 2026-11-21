-- Migration 005: Row Level Security (RLS) Implementation
-- HOMI Platform: Complete Table Protection & Authorization Policies

BEGIN;

-- 1. Enable Row Level Security across all 16 public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;


-- 2. Drop existing policies to ensure clean, idempotent migration

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;


-- 3. Define Granular Policies

-- Table 1: users
CREATE POLICY "users_select_public_workers" ON public.users 
    FOR SELECT TO anon, authenticated 
    USING (role = 'worker' AND available = true);

CREATE POLICY "users_select_own" ON public.users 
    FOR SELECT TO authenticated 
    USING (supabase_id = auth.uid()::text OR email = auth.jwt()->>'email' OR public.is_admin());

CREATE POLICY "users_update_own" ON public.users 
    FOR UPDATE TO authenticated 
    USING (supabase_id = auth.uid()::text OR email = auth.jwt()->>'email' OR public.is_admin())
    WITH CHECK (supabase_id = auth.uid()::text OR email = auth.jwt()->>'email' OR public.is_admin());

CREATE POLICY "users_admin_manage" ON public.users 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 2: customer_profiles
CREATE POLICY "customer_profiles_select_own" ON public.customer_profiles 
    FOR SELECT TO authenticated 
    USING (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "customer_profiles_insert_own" ON public.customer_profiles 
    FOR INSERT TO authenticated 
    WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "customer_profiles_update_own" ON public.customer_profiles 
    FOR UPDATE TO authenticated 
    USING (user_id = public.current_user_id() OR public.is_admin())
    WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "customer_profiles_admin_manage" ON public.customer_profiles 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 3: workers
CREATE POLICY "workers_select_available" ON public.workers 
    FOR SELECT TO anon, authenticated 
    USING (available = true OR public.is_admin());

CREATE POLICY "workers_admin_manage" ON public.workers 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 4: worker_applications
CREATE POLICY "worker_applications_insert_public" ON public.worker_applications 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "worker_applications_admin_manage" ON public.worker_applications 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 5: service_requests
CREATE POLICY "service_requests_insert_public" ON public.service_requests 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "service_requests_select_own" ON public.service_requests 
    FOR SELECT TO authenticated 
    USING (customer_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "service_requests_update_own" ON public.service_requests 
    FOR UPDATE TO authenticated 
    USING (customer_id = public.current_user_id() OR public.is_admin())
    WITH CHECK (customer_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "service_requests_admin_manage" ON public.service_requests 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 6: service_request_images
CREATE POLICY "service_request_images_insert" ON public.service_request_images 
    FOR INSERT TO anon, authenticated 
    WITH CHECK (true);

CREATE POLICY "service_request_images_select" ON public.service_request_images 
    FOR SELECT TO anon, authenticated 
    USING (
        request_id IN (SELECT id FROM public.service_requests WHERE customer_id = public.current_user_id()) 
        OR public.is_admin()
    );


-- Table 7: worker_quotes (Strictly internal to Admins - Never accessible to Customers)
CREATE POLICY "worker_quotes_admin_manage" ON public.worker_quotes 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 8: customer_quotations
CREATE POLICY "customer_quotations_select_own" ON public.customer_quotations 
    FOR SELECT TO authenticated 
    USING (
        customer_id = public.current_user_id() 
        OR request_id IN (SELECT id FROM public.service_requests WHERE customer_id = public.current_user_id()) 
        OR public.is_admin()
    );

CREATE POLICY "customer_quotations_update_decision" ON public.customer_quotations 
    FOR UPDATE TO authenticated 
    USING (
        customer_id = public.current_user_id() 
        OR request_id IN (SELECT id FROM public.service_requests WHERE customer_id = public.current_user_id()) 
        OR public.is_admin()
    )
    WITH CHECK (
        status IN ('ACCEPTED', 'DECLINED') OR public.is_admin()
    );

CREATE POLICY "customer_quotations_admin_manage" ON public.customer_quotations 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 9: assignments
CREATE POLICY "assignments_select_own" ON public.assignments 
    FOR SELECT TO authenticated 
    USING (
        request_id IN (SELECT id FROM public.service_requests WHERE customer_id = public.current_user_id()) 
        OR public.is_admin()
    );

CREATE POLICY "assignments_admin_manage" ON public.assignments 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 10: payments
CREATE POLICY "payments_select_own" ON public.payments 
    FOR SELECT TO authenticated 
    USING (
        customer_id = public.current_user_id() 
        OR request_id IN (SELECT id FROM public.service_requests WHERE customer_id = public.current_user_id()) 
        OR public.is_admin()
    );

CREATE POLICY "payments_insert_own" ON public.payments 
    FOR INSERT TO authenticated 
    WITH CHECK (
        customer_id = public.current_user_id() OR public.is_admin()
    );

CREATE POLICY "payments_admin_manage" ON public.payments 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 11: payment_settings (Public read for UPI ID & QR code)
CREATE POLICY "payment_settings_select_public" ON public.payment_settings 
    FOR SELECT TO anon, authenticated 
    USING (true);

CREATE POLICY "payment_settings_admin_manage" ON public.payment_settings 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 12: app_settings (Public read for platform settings like WhatsApp link)
CREATE POLICY "app_settings_select_public" ON public.app_settings 
    FOR SELECT TO anon, authenticated 
    USING (true);

CREATE POLICY "app_settings_admin_manage" ON public.app_settings 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 13: categories
CREATE POLICY "categories_select_public" ON public.categories 
    FOR SELECT TO anon, authenticated 
    USING (active = true OR public.is_admin());

CREATE POLICY "categories_admin_manage" ON public.categories 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 14: notifications
CREATE POLICY "notifications_select_own" ON public.notifications 
    FOR SELECT TO authenticated 
    USING (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "notifications_update_own" ON public.notifications 
    FOR UPDATE TO authenticated 
    USING (user_id = public.current_user_id() OR public.is_admin())
    WITH CHECK (user_id = public.current_user_id() OR public.is_admin());

CREATE POLICY "notifications_admin_manage" ON public.notifications 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 15: request_status_history
CREATE POLICY "status_history_select_own" ON public.request_status_history 
    FOR SELECT TO authenticated 
    USING (
        request_id IN (SELECT id FROM public.service_requests WHERE customer_id = public.current_user_id()) 
        OR public.is_admin()
    );

CREATE POLICY "status_history_admin_manage" ON public.request_status_history 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());


-- Table 16: admin_activity_logs (Strictly Admin only)
CREATE POLICY "admin_activity_logs_admin_manage" ON public.admin_activity_logs 
    FOR ALL TO authenticated 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());

COMMIT;
