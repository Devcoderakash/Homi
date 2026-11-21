-- Migration 004: Supabase Storage Buckets & Policies
-- HOMI Platform: File Storage Configuration & Security

BEGIN;

-- 1. Create standard storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('request-photos', 'request-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment-assets', 'payment-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('worker-documents', 'worker-documents', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('worker-avatars', 'worker-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- 2. Storage Objects Row Level Security Policies
-- (RLS is already enabled on storage.objects by Supabase storage extension)

-- Clean existing policies for these buckets
DROP POLICY IF EXISTS "Public Access - Request Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Payment Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Worker Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access - Request Photos" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access - Payment Proofs" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access - Worker Documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin Access - Worker Documents Read" ON storage.objects;
DROP POLICY IF EXISTS "Private Read - Payment Proofs" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects;

-- Policy 1: Public Read for Public Buckets
CREATE POLICY "Public Access - Request Photos" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'request-photos');

CREATE POLICY "Public Access - Payment Assets" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'payment-assets');

CREATE POLICY "Public Access - Worker Avatars" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'worker-avatars');

-- Policy 2: Public/Guest & Authenticated Upload to request-photos
CREATE POLICY "Upload Access - Request Photos" 
ON storage.objects FOR INSERT 
TO anon, authenticated 
WITH CHECK (bucket_id = 'request-photos');

-- Policy 3: Authenticated Upload to payment-proofs
CREATE POLICY "Upload Access - Payment Proofs" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'payment-proofs');

-- Policy 4: Public/Applicant Upload to worker-documents
CREATE POLICY "Upload Access - Worker Documents" 
ON storage.objects FOR INSERT 
TO anon, authenticated 
WITH CHECK (bucket_id = 'worker-documents');

-- Policy 5: STRICTLY PRIVATE - Worker Documents Read (Admins Only)
CREATE POLICY "Admin Access - Worker Documents Read" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'worker-documents' AND public.is_admin());

-- Policy 6: Private Read - Payment Proofs (Admins and Customer)
CREATE POLICY "Private Read - Payment Proofs" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'payment-proofs' AND (public.is_admin() OR auth.uid()::text = owner_id));

-- Policy 7: Service Role Full Access (For Go backend and background services)
CREATE POLICY "Service Role Full Access" 
ON storage.objects FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

COMMIT;
