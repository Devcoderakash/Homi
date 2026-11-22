-- Migration 007: Worker Availability Timings & Document Verification
-- Adds availability schedule and document verification fields to workers and worker_applications tables

-- ============================================================
-- workers table: Add new columns
-- ============================================================
ALTER TABLE public.workers
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS available_from VARCHAR(40),
  ADD COLUMN IF NOT EXISTS available_to   VARCHAR(40),
  ADD COLUMN IF NOT EXISTS available_days VARCHAR(100),
  ADD COLUMN IF NOT EXISTS document_type  VARCHAR(80),
  ADD COLUMN IF NOT EXISTS document_url   TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- ============================================================
-- worker_applications table: Add new columns
-- ============================================================
ALTER TABLE public.worker_applications
  ADD COLUMN IF NOT EXISTS available_from VARCHAR(40),
  ADD COLUMN IF NOT EXISTS available_to   VARCHAR(40),
  ADD COLUMN IF NOT EXISTS available_days VARCHAR(100),
  ADD COLUMN IF NOT EXISTS document_type  VARCHAR(80),
  ADD COLUMN IF NOT EXISTS document_url   TEXT;

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON COLUMN public.workers.available_from    IS 'Start of daily working hours e.g. 09:00 AM';
COMMENT ON COLUMN public.workers.available_to      IS 'End of daily working hours e.g. 07:00 PM';
COMMENT ON COLUMN public.workers.available_days    IS 'Working days e.g. Monday to Saturday';
COMMENT ON COLUMN public.workers.document_type     IS 'Government ID type e.g. Aadhaar Card, Voter ID';
COMMENT ON COLUMN public.workers.document_url      IS 'Base64 or URL of uploaded verification document image';
COMMENT ON COLUMN public.workers.profile_photo_url IS 'Worker profile photo URL or base64 data';
COMMENT ON COLUMN public.workers.bio               IS 'Worker self-description / bio';

COMMENT ON COLUMN public.worker_applications.available_from IS 'Start of daily working hours submitted in application';
COMMENT ON COLUMN public.worker_applications.available_to   IS 'End of daily working hours submitted in application';
COMMENT ON COLUMN public.worker_applications.available_days IS 'Working days submitted in application';
COMMENT ON COLUMN public.worker_applications.document_type  IS 'Type of verification document uploaded';
COMMENT ON COLUMN public.worker_applications.document_url   IS 'Base64 or URL of verification document image';
