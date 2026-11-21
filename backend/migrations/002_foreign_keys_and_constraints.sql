-- Migration 002: Foreign Keys & Integrity Constraints
-- HOMI Platform: Complete Relational & Business Integrity Constraints

BEGIN;

-- 1. Clean up legacy orphan records before adding foreign keys
DELETE FROM public.customer_profiles WHERE user_id NOT IN (SELECT id FROM public.users);
UPDATE public.customer_quotations SET selected_worker_id = NULL WHERE selected_worker_id IS NOT NULL AND selected_worker_id NOT IN (SELECT id FROM public.workers);
DELETE FROM public.notifications WHERE user_id NOT IN (SELECT id FROM public.users);

-- 2. Foreign Key Constraints (Idempotent drops & adds)

-- customer_profiles -> users
ALTER TABLE public.customer_profiles DROP CONSTRAINT IF EXISTS fk_customer_profiles_user;
ALTER TABLE public.customer_profiles ADD CONSTRAINT fk_customer_profiles_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- workers -> users
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS fk_workers_user;
ALTER TABLE public.workers ADD CONSTRAINT fk_workers_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- worker_quotes -> workers
ALTER TABLE public.worker_quotes DROP CONSTRAINT IF EXISTS fk_worker_quotes_worker;
ALTER TABLE public.worker_quotes ADD CONSTRAINT fk_worker_quotes_worker 
    FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE SET NULL;

-- customer_quotations -> users (customer)
ALTER TABLE public.customer_quotations DROP CONSTRAINT IF EXISTS fk_customer_quotations_customer;
ALTER TABLE public.customer_quotations ADD CONSTRAINT fk_customer_quotations_customer 
    FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- customer_quotations -> workers (selected_worker)
ALTER TABLE public.customer_quotations DROP CONSTRAINT IF EXISTS fk_customer_quotations_selected_worker;
ALTER TABLE public.customer_quotations ADD CONSTRAINT fk_customer_quotations_selected_worker 
    FOREIGN KEY (selected_worker_id) REFERENCES public.workers(id) ON DELETE SET NULL;

-- assignments -> customer_quotations
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS fk_assignments_quotation;
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_quotation 
    FOREIGN KEY (quotation_id) REFERENCES public.customer_quotations(id) ON DELETE SET NULL;

-- assignments -> workers
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS fk_assignments_worker;
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_worker 
    FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE SET NULL;

-- assignments -> users (assigned_by admin)
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS fk_assignments_assigned_by;
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_assigned_by 
    FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE RESTRICT;

-- assignments -> users (completed_by admin)
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS fk_assignments_completed_by;
ALTER TABLE public.assignments ADD CONSTRAINT fk_assignments_completed_by 
    FOREIGN KEY (completed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- payments -> customer_quotations
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_payments_quotation;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_quotation 
    FOREIGN KEY (quotation_id) REFERENCES public.customer_quotations(id) ON DELETE SET NULL;

-- payments -> users (verified_by admin)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS fk_payments_verified_by;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_verified_by 
    FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- notifications -> users
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS fk_notifications_user;
ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_user 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- notifications -> service_requests
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS fk_notifications_request;
ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_request 
    FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

-- request_status_history -> service_requests
ALTER TABLE public.request_status_history DROP CONSTRAINT IF EXISTS fk_request_status_history_request;
ALTER TABLE public.request_status_history ADD CONSTRAINT fk_request_status_history_request 
    FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE;

-- request_status_history -> users (changed_by)
ALTER TABLE public.request_status_history DROP CONSTRAINT IF EXISTS fk_request_status_history_changed_by;
ALTER TABLE public.request_status_history ADD CONSTRAINT fk_request_status_history_changed_by 
    FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- admin_activity_logs -> users (admin_id)
ALTER TABLE public.admin_activity_logs DROP CONSTRAINT IF EXISTS fk_admin_activity_logs_admin;
ALTER TABLE public.admin_activity_logs ADD CONSTRAINT fk_admin_activity_logs_admin 
    FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- service_requests -> users (approved_by)
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS fk_service_requests_approved_by;
ALTER TABLE public.service_requests ADD CONSTRAINT fk_service_requests_approved_by 
    FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- service_requests -> users (completed_by)
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS fk_service_requests_completed_by;
ALTER TABLE public.service_requests ADD CONSTRAINT fk_service_requests_completed_by 
    FOREIGN KEY (completed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- worker_applications -> users (reviewed_by)
ALTER TABLE public.worker_applications DROP CONSTRAINT IF EXISTS fk_worker_applications_reviewed_by;
ALTER TABLE public.worker_applications ADD CONSTRAINT fk_worker_applications_reviewed_by 
    FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Check Constraints (Business rules & valid enum ranges)

-- users.role check
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE public.users ADD CONSTRAINT chk_users_role 
    CHECK (role IN ('customer', 'admin', 'worker'));

-- service_requests.status check
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS chk_service_requests_status;
ALTER TABLE public.service_requests ADD CONSTRAINT chk_service_requests_status 
    CHECK (status IN (
        'NEW', 'UNDER_REVIEW', 'SHARED_WITH_WORKERS', 'WORKER_SELECTED',
        'CUSTOMER_APPROVAL_PENDING', 'CUSTOMER_CONFIRMED', 'ASSIGNED',
        'IN_PROGRESS', 'COMPLETED', 'CUSTOMER_DECLINED', 'CANCELLED', 'REJECTED'
    ));

-- customer_quotations.status check
ALTER TABLE public.customer_quotations DROP CONSTRAINT IF EXISTS chk_customer_quotations_status;
ALTER TABLE public.customer_quotations ADD CONSTRAINT chk_customer_quotations_status 
    CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED'));

-- assignments.status check
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS chk_assignments_status;
ALTER TABLE public.assignments ADD CONSTRAINT chk_assignments_status 
    CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- payments.status check
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS chk_payments_status;
ALTER TABLE public.payments ADD CONSTRAINT chk_payments_status 
    CHECK (status IN ('NOT_DUE', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAYMENT_REJECTED', 'PAID'));

-- worker_applications.status check
ALTER TABLE public.worker_applications DROP CONSTRAINT IF EXISTS chk_worker_applications_status;
ALTER TABLE public.worker_applications ADD CONSTRAINT chk_worker_applications_status 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Non-negative monetary amounts check constraints
ALTER TABLE public.customer_quotations DROP CONSTRAINT IF EXISTS chk_customer_quotations_final_total_nonneg;
ALTER TABLE public.customer_quotations ADD CONSTRAINT chk_customer_quotations_final_total_nonneg 
    CHECK (final_total >= 0);

ALTER TABLE public.worker_quotes DROP CONSTRAINT IF EXISTS chk_worker_quotes_amount_nonneg;
ALTER TABLE public.worker_quotes ADD CONSTRAINT chk_worker_quotes_amount_nonneg 
    CHECK (quoted_amount >= 0);

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS chk_payments_amount_nonneg;
ALTER TABLE public.payments ADD CONSTRAINT chk_payments_amount_nonneg 
    CHECK (amount >= 0);

COMMIT;
