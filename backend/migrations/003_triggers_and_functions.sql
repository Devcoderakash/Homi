-- Migration 003: Database Functions & Business Integrity Triggers
-- HOMI Platform: Workflow Validation, Timestamps & Auth Synchronization

BEGIN;

-- 1. Helper Security Functions (Used in RLS and Triggers)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE (supabase_id = auth.uid()::text OR email = auth.jwt()->>'email')
      AND role = 'admin'
  ) OR (auth.jwt()->>'role' = 'service_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS BIGINT AS $$
DECLARE
  uid BIGINT;
BEGIN
  SELECT id INTO uid FROM public.users 
  WHERE supabase_id = auth.uid()::text OR email = auth.jwt()->>'email'
  LIMIT 1;
  RETURN uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Generic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach set_updated_at trigger to tables with updated_at column
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_profiles_updated_at ON public.customer_profiles;
CREATE TRIGGER trg_customer_profiles_updated_at BEFORE UPDATE ON public.customer_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workers_updated_at ON public.workers;
CREATE TRIGGER trg_workers_updated_at BEFORE UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_worker_applications_updated_at ON public.worker_applications;
CREATE TRIGGER trg_worker_applications_updated_at BEFORE UPDATE ON public.worker_applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_worker_quotes_updated_at ON public.worker_quotes;
CREATE TRIGGER trg_worker_quotes_updated_at BEFORE UPDATE ON public.worker_quotes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_quotations_updated_at ON public.customer_quotations;
CREATE TRIGGER trg_customer_quotations_updated_at BEFORE UPDATE ON public.customer_quotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payment_settings_updated_at ON public.payment_settings;
CREATE TRIGGER trg_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 3. Workflow Validation Trigger: Enforce No Worker Assignment Before Customer Confirmation
CREATE OR REPLACE FUNCTION public.validate_assignment_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_request_status VARCHAR(40);
  v_has_accepted_quote BOOLEAN;
BEGIN
  -- 1. Check parent service request existence and status
  SELECT status INTO v_request_status 
  FROM public.service_requests 
  WHERE id = NEW.request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot assign worker: service request #% does not exist.', NEW.request_id;
  END IF;

  -- 2. Verify whether an accepted quotation exists for this request
  SELECT EXISTS (
    SELECT 1 FROM public.customer_quotations 
    WHERE request_id = NEW.request_id AND status = 'ACCEPTED'
  ) INTO v_has_accepted_quote;

  -- 3. Reject assignment if customer has not approved quotation or request is not confirmed
  IF NOT (v_request_status IN ('CUSTOMER_CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED') OR v_has_accepted_quote) THEN
    RAISE EXCEPTION 'Cannot assign worker to request #%: Customer must approve quotation first (current request status: ''%'').', 
      NEW.request_id, v_request_status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_assignment_before_insert ON public.assignments;
CREATE TRIGGER trg_validate_assignment_before_insert
BEFORE INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_assignment_before_insert();


-- 4. Supabase Auth Sync Trigger: Synchronize auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    '',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
  SET supabase_id = EXCLUDED.supabase_id,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

COMMIT;
