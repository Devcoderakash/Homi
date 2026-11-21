-- Migration 001: Initial Schema Documentation
-- HOMI Platform: Core PostgreSQL Schema Baseline
-- Description: Verifies baseline tables exist with primary keys and default sequences.

CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    supabase_id VARCHAR(64) UNIQUE,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(40) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    password_hash TEXT NOT NULL,
    city VARCHAR(120),
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    location_label VARCHAR(300),
    location_source VARCHAR(20),
    specialty VARCHAR(80),
    bio TEXT,
    experience_years BIGINT DEFAULT 0,
    visit_fee BIGINT DEFAULT 19900,
    available BOOLEAN DEFAULT true,
    service_radius_km BIGINT DEFAULT 15,
    spoken_languages VARCHAR(100) DEFAULT 'hi,en',
    rating NUMERIC,
    review_count BIGINT DEFAULT 0,
    location_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    full_name VARCHAR(120),
    phone VARCHAR(40),
    city VARCHAR(120),
    area VARCHAR(120),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(255),
    specialty VARCHAR(80) NOT NULL,
    skills TEXT,
    experience_years BIGINT DEFAULT 0,
    city VARCHAR(120),
    area VARCHAR(120),
    address TEXT,
    visit_fee BIGINT DEFAULT 19900,
    available BOOLEAN DEFAULT true,
    rating NUMERIC,
    review_count BIGINT DEFAULT 0,
    service_radius_km BIGINT DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.worker_applications (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT,
    worker_id BIGINT,
    full_name VARCHAR(120),
    phone VARCHAR(40),
    email VARCHAR(255),
    category VARCHAR(80),
    skills TEXT,
    experience_years BIGINT DEFAULT 0,
    city VARCHAR(120),
    area VARCHAR(120),
    address TEXT,
    bio TEXT,
    profile_photo_url TEXT,
    documents_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by BIGINT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_requests (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    worker_id BIGINT,
    category VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    contact_name VARCHAR(120),
    contact_phone VARCHAR(40),
    address TEXT NOT NULL,
    city VARCHAR(120) NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    location_label VARCHAR(300),
    location_source VARCHAR(20),
    preferred_date VARCHAR(30) NOT NULL,
    preferred_time VARCHAR(50) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    status VARCHAR(40) NOT NULL DEFAULT 'NEW',
    quoted_amount BIGINT,
    quote_note TEXT,
    quote_status VARCHAR(20) DEFAULT 'none',
    payment_status VARCHAR(25) DEFAULT 'unpaid',
    payment_method VARCHAR(20),
    paid_at TIMESTAMPTZ,
    whatsapp_shared_at TIMESTAMPTZ,
    selected_worker_id BIGINT,
    selected_worker_name VARCHAR(120),
    selected_worker_phone VARCHAR(40),
    quote_labour_charges BIGINT DEFAULT 0,
    quote_material_charges BIGINT DEFAULT 0,
    quote_inspection_charges BIGINT DEFAULT 0,
    quote_additional_charges BIGINT DEFAULT 0,
    quote_discount BIGINT DEFAULT 0,
    quote_final_total BIGINT,
    quote_work_description TEXT,
    quote_estimated_duration VARCHAR(80),
    quote_proposed_visit_date VARCHAR(40),
    quote_proposed_visit_time VARCHAR(60),
    quote_notes TEXT,
    quote_sent_at TIMESTAMPTZ,
    customer_approved_at TIMESTAMPTZ,
    customer_declined_at TIMESTAMPTZ,
    customer_decline_reason TEXT,
    admin_notes TEXT,
    approved_at TIMESTAMPTZ,
    approved_by BIGINT,
    visit_starts_at TIMESTAMPTZ,
    visit_status VARCHAR(20) DEFAULT 'none',
    completed_at TIMESTAMPTZ,
    completed_by BIGINT,
    completion_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.service_request_images (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    content_type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.worker_quotes (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    worker_id BIGINT,
    worker_name VARCHAR(120) NOT NULL,
    worker_phone VARCHAR(40) NOT NULL,
    quoted_amount BIGINT NOT NULL,
    labour_charges BIGINT DEFAULT 0,
    material_charges BIGINT DEFAULT 0,
    additional_charges BIGINT DEFAULT 0,
    availability VARCHAR(120),
    estimated_completion_time VARCHAR(120),
    notes TEXT,
    is_selected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_quotations (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    customer_id BIGINT,
    selected_worker_id BIGINT,
    selected_worker_name VARCHAR(120),
    selected_worker_phone VARCHAR(40),
    work_description TEXT,
    labour_charges BIGINT DEFAULT 0,
    material_charges BIGINT DEFAULT 0,
    inspection_charges BIGINT DEFAULT 0,
    additional_charges BIGINT DEFAULT 0,
    discount BIGINT DEFAULT 0,
    final_total BIGINT NOT NULL,
    estimated_duration VARCHAR(80),
    proposed_visit_date VARCHAR(40),
    proposed_visit_time VARCHAR(60),
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    decline_reason TEXT,
    sent_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    quotation_id BIGINT,
    worker_id BIGINT,
    worker_name VARCHAR(120),
    worker_phone VARCHAR(40),
    assigned_by BIGINT NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'ASSIGNED',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed_by BIGINT,
    completion_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    quotation_id BIGINT,
    customer_id BIGINT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    payment_method VARCHAR(40) NOT NULL DEFAULT 'UPI',
    transaction_reference VARCHAR(120),
    payment_date VARCHAR(30),
    payment_screenshot_path TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PAYMENT_PENDING',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_settings (
    id BIGSERIAL PRIMARY KEY,
    upi_id VARCHAR(120),
    payee_name VARCHAR(120),
    qr_storage_path TEXT,
    qr_code_url TEXT,
    bank_account_holder VARCHAR(120),
    bank_name VARCHAR(120),
    account_number VARCHAR(60),
    ifsc VARCHAR(30),
    branch VARCHAR(120),
    enable_upi BOOLEAN NOT NULL DEFAULT true,
    enable_bank BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(80) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.request_status_history (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    changed_by BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    active BOOLEAN DEFAULT true,
    sort_order BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    request_id BIGINT,
    kind VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
