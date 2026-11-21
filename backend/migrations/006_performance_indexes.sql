-- Migration 006: High-Performance Composite & Foreign Key Indexes
-- HOMI Platform: Query Optimization for Production Load

BEGIN;

-- 1. Composite indexes for common dashboard & filtering query patterns
CREATE INDEX IF NOT EXISTS idx_service_requests_status_created 
    ON public.service_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer_status 
    ON public.service_requests (customer_id, status);

CREATE INDEX IF NOT EXISTS idx_worker_quotes_selected 
    ON public.worker_quotes (request_id, is_selected);

CREATE INDEX IF NOT EXISTS idx_customer_quotations_status 
    ON public.customer_quotations (request_id, status);

-- 2. Partial index for lightning-fast unread notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON public.notifications (user_id) 
    WHERE read_at IS NULL;

-- 3. Composite indexes for admin queues (payments and applications)
CREATE INDEX IF NOT EXISTS idx_payments_status_created 
    ON public.payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_worker_applications_status_applied 
    ON public.worker_applications (status, applied_at DESC);

-- 4. Audit trail index for admin activity timeline
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created 
    ON public.admin_activity_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_status_history_created 
    ON public.request_status_history (request_id, created_at DESC);

COMMIT;
