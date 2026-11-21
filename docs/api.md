# HOMI — API Reference Specification (v1)

Base URL: `http://localhost:4000/api/v1`
Compatibility Alias: `http://localhost:4000/api`

---

## Authentication

All protected endpoints accept either:
1. HTTP Header: `Authorization: Bearer <jwt_token>`
2. HTTP Cookie: `homi_session=<jwt_token>` or `token=<jwt_token>`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a customer account.
- **Body**:
  ```json
  {
    "name": "Rohan Sharma",
    "email": "rohan@example.com",
    "phone": "+919876543210",
    "password": "SecurePassword123!",
    "city": "Bhopal",
    "address": "Arera Colony"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "ok": true,
    "user": { "id": 1, "name": "Rohan Sharma", "role": "customer" },
    "token": "eyJhbGciOi..."
  }
  ```

### `POST /auth/login`
Authenticates a customer or administrator.
- **Body**:
  ```json
  {
    "email": "admin@homi.demo",
    "password": "demo1234"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "user": { "id": 423, "email": "admin@homi.demo", "role": "admin" },
    "token": "eyJhbGciOi..."
  }
  ```

### `GET /auth/me`
Returns the currently authenticated user session.

### `POST /auth/logout`
Clears session cookies.

---

## 2. Customer Endpoints

### `POST /requests`
Submits a home service request. Supports guest submissions and authenticated customers.
- **Body**:
  ```json
  {
    "category": "Plumbing",
    "title": "Kitchen Sink Pipe Burst",
    "description": "Urgent water leakage under sink",
    "contactName": "Rohan Sharma",
    "contactPhone": "+919876543210",
    "address": "Flat 202, Green Valley Apartments",
    "city": "Bhopal",
    "area": "Arera Colony",
    "preferredDate": "2026-11-20",
    "preferredTime": "Morning (8am – 12pm)"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "ok": true,
    "id": 101,
    "request": { "id": 101, "status": "NEW" }
  }
  ```

### `POST /requests/:id/photos`
Uploads up to 3 repair photographs (`multipart/form-data`).

### `POST /requests/:id/customer-decision`
Customer reviews and either accepts or declines quotation.
- **Body**:
  ```json
  {
    "decision": "accept",
    "reason": "Price approved"
  }
  ```
- **Response `200 OK`**: Updates status to `CUSTOMER_CONFIRMED`.

---

## 3. WhatsApp & Quotation Flow (Admin Endpoints)

### `GET /admin/requests/:id/whatsapp-message`
Generates privacy-masked technician broadcast message. Customer flat number and phone are masked.
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "whatsappMessage": "🏠 HOMI – NEW SERVICE REQUEST\nRequest ID: #HOMI-101\nService: Plumbing...",
    "groupLink": "https://chat.whatsapp.com/ISoKOfnlJEe1MowRiGGlGb?s=cl&p=a&iam=2",
    "alreadyShared": false
  }
  ```

### `POST /admin/requests/:id/mark-shared`
Marks request as shared with WhatsApp technician group.
- **Response `200 OK`**: Updates status to `SHARED_WITH_WORKERS`.

### `POST /admin/requests/:id/quotes`
Records technician quotes received from WhatsApp group.
- **Body**:
  ```json
  {
    "workerName": "Suresh Lodhi",
    "workerPhone": "+919826011122",
    "labourCharges": 300,
    "materialCharges": 120,
    "additionalCharges": 0,
    "availability": "Tomorrow 10 AM",
    "estimatedCompletionTime": "1.5 hours",
    "notes": "Standard pipe fix"
  }
  ```

### `POST /admin/requests/:id/quotes/:quoteId/select`
Selects preferred quote. Updates request status to `WORKER_SELECTED`. **Does NOT assign.**

### `POST /admin/requests/:id/customer-quote`
Generates customer quotation with backend mathematical validation.
Formula: `finalTotal = (labour + material + inspection + additional) - discount`
- **Response `200 OK`**: Updates status to `CUSTOMER_APPROVAL_PENDING`.

### `POST /admin/requests/:id/confirm-assignment`
Confirms technician assignment.
**Guard Rule**: Strictly fails with `400 Bad Request` if customer status is not `CUSTOMER_CONFIRMED`.
- **Response `200 OK`**: Updates status to `ASSIGNED`.

---

## 4. Public Worker Application (Become a Worker)

### `POST /worker-applications` (or `/workers/apply`)
Public form submission. No login or account required.
- **Body**:
  ```json
  {
    "fullName": "Dinesh Carpenter",
    "phone": "+919893012345",
    "email": "dinesh@example.com",
    "category": "Carpentry",
    "skills": "Furniture repair, modular kitchen",
    "experienceYears": 6,
    "city": "Bhopal",
    "area": "Kolar Road"
  }
  ```
- **Response `201 Created`**: Application created with status `PENDING`.

### `POST /admin/worker-applications/:id/approve`
Admin approves application. Automatically creates an approved profile in the `workers` directory.
