# HOMI — On-Demand Household Services Platform

Production-grade, hyper-local on-demand household services platform built with a high-performance **Go (Golang) + Gin backend**, **Supabase PostgreSQL & Storage**, and **Next.js 16 frontends**.

```text
homi/
├── frontend/
│   ├── customer-app/        # Customer Web App (Next.js 16, Port 3000)
│   └── admin-panel/         # Admin Management Console (Next.js 16, Port 3001)
│
├── backend/                 # High-Performance Go + Gin REST API (Port 4000)
│   ├── cmd/
│   │   └── api/
│   │       └── main.go      # Go Application Entrypoint
│   ├── internal/
│   │   ├── config/          # Environment configuration loader (.env)
│   │   ├── database/        # GORM & PostgreSQL initialization + connection pooling
│   │   ├── models/          # Domain GORM models & status constants
│   │   ├── handlers/        # HTTP Handlers (Auth, Customer, Request, WhatsApp, Quote, Worker)
│   │   ├── services/        # Domain Business Logic (Math validation, privacy masking, guards)
│   │   ├── middleware/      # CORS, JWT Authentication & Role Authorization
│   │   ├── routes/          # REST API Route Groups (/api/v1 and /api)
│   │   └── utils/           # Crypto, JWT, status transition state machine, responses
│   ├── uploads/             # Static file storage fallback
│   ├── go.mod               # Go dependencies module
│   ├── .env                 # Active environment variables
│   └── .env.example         # Example environment template
│
├── docs/                    # Architecture, Supabase & API documentation
│   ├── architecture.md      # System diagram & workflow specification
│   ├── supabase-setup.md    # Supabase PostgreSQL & Storage setup
│   └── api.md               # Complete REST API reference
│
├── compose.yaml             # Docker Compose configuration
└── README.md                # Project documentation
```

---

## 1. Architecture & Port Mapping

| Service | Technology | Port | Access URL |
| :--- | :--- | :--- | :--- |
| **Backend API** | Go 1.24 + Gin + GORM + Supabase PostgreSQL | **4000** | `http://localhost:4000/api/v1` |
| **Customer App** | Next.js 16 (App Router) + React 19 + TypeScript | **3000** | `http://localhost:3000` |
| **Admin Panel** | Next.js 16 (App Router) + React 19 + TypeScript | **3001** | `http://localhost:3001` |
| **Database** | Supabase PostgreSQL 16 | **5432** | `localhost:5432` / Supabase Cloud |

> **IMPORTANT PLATFORM PRINCIPLE**:
> There are exactly **TWO frontend applications**:
> 1. `frontend/customer-app` (Port 3000)
> 2. `frontend/admin-panel` (Port 3001)
> 
> There is **NO separate worker portal, worker dashboard, or worker login**.
> Technicians interact via WhatsApp dispatch and phone calls. Prospective technicians submit a public application via **Become a Worker** (`/become-a-worker`).

---

## 2. 8-Stage Business Lifecycle

1. **Request Submission (`NEW`)**: Customer submits repair request with description, address, city, preferred date/time, and photos.
2. **WhatsApp Sharing (`SHARED_WITH_WORKERS`)**: Admin generates a privacy-masked job broadcast message (customer flat number and phone number are strictly hidden) and opens the configured WhatsApp group.
3. **Worker Quotation Entry**: Admin inputs bids and availability received from technicians in the WhatsApp group.
4. **Preferred Worker Selection (`WORKER_SELECTED`)**: Admin selects a preferred technician quote. *(Worker is NOT assigned yet)*.
5. **Customer Quotation Generation (`CUSTOMER_APPROVAL_PENDING`)**: Admin creates a customer-facing quotation with backend mathematical validation:
   $$\text{Final Total} = (\text{Labour} + \text{Material} + \text{Inspection} + \text{Additional}) - \text{Discount}$$
6. **Customer Review & Acceptance (`CUSTOMER_CONFIRMED` or `CUSTOMER_DECLINED`)**: Customer reviews quotation in dashboard and confirms or declines with reason.
7. **Technician Assignment (`ASSIGNED`)**: Admin confirms assignment. **Guard rule**: Backend strictly rejects assignment prior to customer confirmation.
8. **Execution & Completion (`IN_PROGRESS` $\rightarrow$ `COMPLETED`)**: Technician completes work and status is marked complete.

---

## 3. Quick Start & Setup

### Prerequisites
- **Go**: 1.24 or higher
- **Node.js**: 20 or higher
- **PostgreSQL / Supabase**: PostgreSQL 16 database

### Step 1: Backend Setup
```bash
cd backend
cp .env.example .env
# Update DATABASE_URL and SUPABASE credentials in .env

# Build and run
go build -o bin/api cmd/api/main.go
./bin/api
```
Server starts on `http://localhost:4000`.

### Step 2: Customer App Setup
```bash
cd frontend/customer-app
npm install
npm run dev
```
Runs on `http://localhost:3000`.

### Step 3: Admin Panel Setup
```bash
cd frontend/admin-panel
npm install
npm run dev
```
Runs on `http://localhost:3001`. Default administrator credentials:
- **Email**: `admin@homi.demo`
- **Password**: `demo1234`

---

## 4. Environment Variables Reference

See [backend/.env.example](file:///Users/akashlodhi/on-demand-household-service-platform/backend/.env.example) for the full list of configuration variables:

```env
PORT=4000
APP_ENV=development

# Supabase / PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Managed Infrastructure Credentials
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Authentication
JWT_SECRET=your-jwt-secret-key-at-least-32-characters
JWT_EXPIRATION_HOURS=720

# Frontend URLs for CORS
CUSTOMER_APP_URL=http://localhost:3000
ADMIN_APP_URL=http://localhost:3001

# WhatsApp Workers Group Integration
WHATSAPP_GROUP_INVITE_URL=https://chat.whatsapp.com/ISoKOfnlJEe1MowRiGGlGb?s=cl&p=a&iam=2
```

---

## 5. End-to-End Test Suite

Run the automated 15-scenario verification script covering customer registration, request creation, WhatsApp masking, mathematical quotation verification, premature assignment guard, customer approval, technician assignment, and public worker applications:

```bash
python3 scratch/verify_all_scenarios.py
```
*(All 15 scenarios validated with 100% pass rate)*.
