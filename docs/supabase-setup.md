# HOMI — Supabase Setup & Database Architecture Guide

This guide walks through configuring Supabase PostgreSQL and Supabase Storage for the Homi platform.

---

## 1. Supabase Project Creation

1. Log into your [Supabase Dashboard](https://app.supabase.com).
2. Click **New project** and specify:
   - **Name**: `homi-production`
   - **Database Password**: Choose a strong password (minimum 16 characters).
   - **Region**: `ap-south-1 (Mumbai)` for optimal latency across India.
3. Once provisioned, navigate to **Project Settings** → **Database**:
   - Under **Connection string** → **URI**, copy the PostgreSQL connection URL:
     ```text
     postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
     ```

---

## 2. Supabase Storage Configuration

Create two public storage buckets for uploading images and verification documents:

### Bucket 1: `request-photos`
- **Purpose**: Customer photos of household repairs (leaking taps, broken tiles, etc.).
- **Public**: `true` (Public bucket)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Max file size**: `10MB`

### Bucket 2: `worker-documents`
- **Purpose**: KYC and ID proofs submitted via "Become a Worker" applications.
- **Public**: `false` (Private bucket, accessible only via signed URLs or Service Role key)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `application/pdf`
- **Max file size**: `15MB`

---

## 3. Database Schema Migration

The Go backend utilizes GORM with non-destructive, incremental migrations. All tables, primary keys, foreign keys, and indexes are automatically verified at server launch.

### Core Tables Summary

| Table Name | Description | Key Relationships |
| :--- | :--- | :--- |
| `users` | Customer & Admin accounts | Stores authentication hashes & roles |
| `customer_profiles` | Extended profile metadata | `user_id` references `users(id)` |
| `service_requests` | Service requests and lifecycle state | `customer_id` references `users(id)` |
| `service_request_images` | Multi-image attachments | `request_id` references `service_requests(id)` |
| `worker_quotes` | WhatsApp quotes from technicians | `request_id` references `service_requests(id)` |
| `customer_quotations` | Final customer-facing verified quote | `request_id` references `service_requests(id)` |
| `worker_applications` | Public "Become a Worker" applications | Standalone submissions (`PENDING`, `APPROVED`) |
| `workers` | Approved directory of local technicians | Populated upon application approval |
| `assignments` | Technician dispatch confirmations | `request_id` references `service_requests(id)` |
| `request_status_history` | Audit trail of all request transitions | `request_id` references `service_requests(id)` |
| `admin_activity_logs` | Audit trail of all administrative actions | `admin_id` references `users(id)` |
| `app_settings` | Platform runtime settings | `key = whatsapp_workers_group_link` |
| `categories` | Service categories | Active repair categories & icons |
| `notifications` | In-app alerts for customers & admin | `user_id` references `users(id)` |

---

## 4. Connecting the Go Backend

Add the Supabase credentials to `backend/.env`:

```env
# Primary PostgreSQL Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Storage Integration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

The Go backend automatically establishes pooled PostgreSQL connections with:
- `SetMaxIdleConns`: 10
- `SetMaxOpenConns`: 50
- `SetConnMaxLifetime`: 1 hour
