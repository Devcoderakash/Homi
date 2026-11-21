-- HOMI Platform: Clear Demo & Operational Test Data
BEGIN;

-- 1. Wipe all operational tables
DELETE FROM payments;
DELETE FROM worker_quotes;
DELETE FROM customer_quotations;
DELETE FROM service_request_images;
DELETE FROM request_status_history;
DELETE FROM admin_activity_logs;
DELETE FROM request_photos;
DELETE FROM request_events;
DELETE FROM messages;
DELETE FROM reviews;
DELETE FROM worker_applications;
DELETE FROM assignments;
DELETE FROM service_requests;
DELETE FROM admin_notifications;
DELETE FROM notifications;
DELETE FROM audit_logs;
DELETE FROM rate_limits;
DELETE FROM customer_profiles;
DELETE FROM pending_registrations;

-- 2. Clean & deduplicate workers (unlink user_id and remove duplicate test workers)
UPDATE workers SET user_id = NULL;

DELETE FROM workers 
WHERE name = 'Dinesh Carpenter' 
  AND id NOT IN (
    SELECT MIN(id) FROM workers WHERE name = 'Dinesh Carpenter'
  );

-- 3. Delete non-admin sessions and non-admin users
DELETE FROM sessions 
WHERE user_id IN (
  SELECT id FROM users WHERE email <> 'admin@homi.demo'
);

DELETE FROM users 
WHERE email <> 'admin@homi.demo';

-- 4. Reset auto-increment sequences back to 1
ALTER SEQUENCE IF EXISTS service_requests_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS worker_quotes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_quotations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS service_request_images_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS request_status_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS admin_activity_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS worker_applications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS assignments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS payments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS admin_notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS request_events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS request_photos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS messages_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS pending_registrations_id_seq RESTART WITH 1;

COMMIT;
