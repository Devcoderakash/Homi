# HOMI — System Architecture & Workflow Specification

## 1. System Overview

Homi is a clean, hyper-local on-demand home services platform for Bhopal, India.
The system connects households needing repairs (plumbing, carpentry, electrical, appliances, etc.) with verified local technicians through a structured 8-stage quotation and approval workflow managed by platform administrators.

```mermaid
flowchart TD
    subgraph Clients["Frontend Layer (Next.js 16)"]
        CustomerApp["Customer App\n(:3000)\n• Service Requests\n• Local Worker Directory\n• Become a Worker (Public)\n• Quotation Review"]
        AdminPanel["Admin Control Console\n(:3001)\n• Request Management\n• WhatsApp Dispatch\n• Quote Math & Review\n• Worker Directory & Approval"]
    end

    subgraph BackendLayer["Backend Layer (Go 1.24 + Gin)"]
        GinRouter["Gin HTTP Router (:4000)\nREST API Prefix: /api/v1\nCompatibility Alias: /api"]
        AuthMiddleware["JWT Authentication &\nRole Guard (Admin / Customer)"]
        
        subgraph Services["Domain Services"]
            AuthSvc["AuthService"]
            ReqSvc["RequestService"]
            QuoteSvc["QuotationService (Math Engine)"]
            AssignSvc["AssignmentService (Guard)"]
            WhatsAppSvc["WhatsAppService (Masking)"]
            WorkerAppSvc["WorkerApplicationService"]
            WorkerSvc["WorkerService"]
            StorageSvc["StorageService (Supabase/Local)"]
        end
    end

    subgraph External["External Services & Channels"]
        WhatsAppGroup["WhatsApp Workers Group\nManual Dispatch & Bidding"]
    end

    subgraph DataLayer["Data & Storage Layer (Supabase)"]
        Postgres["Supabase PostgreSQL 16\n• Users & Customer Profiles\n• Service Requests & Status History\n• Worker Quotes & Quotations\n• Workers & Applications\n• Activity Logs & Settings"]
        Storage["Supabase Storage Buckets\n• request-photos\n• worker-documents"]
    end

    CustomerApp -->|HTTP / JSON + JWT| GinRouter
    AdminPanel -->|HTTP / JSON + JWT| GinRouter
    GinRouter --> AuthMiddleware
    AuthMiddleware --> Services
    Services --> Postgres
    Services --> Storage
    AdminPanel -.->|Manual Copy & Open Link| WhatsAppGroup
```

---

## 2. Technology Stack

| Layer | Component | Specification |
| :--- | :--- | :--- |
| **Backend** | Language | Go (Golang 1.24+) |
| | Framework | Gin (`github.com/gin-gonic/gin`) |
| | ORM | GORM (`gorm.io/gorm` + `gorm.io/driver/postgres`) |
| | Port | `4000` |
| | Primary API Prefix | `/api/v1` |
| | Compatibility Alias | `/api` |
| | Password Hashing | Dual format: standard `bcrypt` & legacy Node.js `scrypt` |
| | Auth Tokens | Standard JWT (`github.com/golang-jwt/jwt/v5`) |
| **Database & Infrastructure** | Database Engine | Supabase PostgreSQL 16 |
| | Object Storage | Supabase Storage (fallback: local static `./uploads`) |
| **Frontend** | Customer App | Next.js 16 + React 19 + TypeScript (Port `3000`) |
| | Admin Panel | Next.js 16 + React 19 + TypeScript (Port `3001`) |
| | Worker Access | **Public Application Form only** (No separate worker app or portal) |

---

## 3. Strict 8-Stage Business Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    actor A as Platform Admin
    participant WA as WhatsApp Group
    participant B as Go Backend
    participant DB as Supabase PostgreSQL

    Note over C,DB: Stage 1: Request Creation
    C->>B: POST /api/v1/requests (title, description, location, preferred time)
    B->>DB: Save Request (Status = NEW)
    
    Note over A,WA: Stage 2: WhatsApp Sharing
    A->>B: GET /api/v1/admin/requests/:id/whatsapp-message
    B-->>A: Masked Job Message (No phone, no flat number)
    A->>WA: Manually pastes message into technician group
    A->>B: POST /api/v1/admin/requests/:id/mark-shared
    B->>DB: Status = SHARED_WITH_WORKERS

    Note over A,WA: Stage 3: Worker Quotes Entry
    WA-->>A: Technicians share price & availability via WhatsApp
    A->>B: POST /api/v1/admin/requests/:id/quotes (Labour, Material, Notes)
    B->>DB: Insert worker_quotes

    Note over A,DB: Stage 4: Preferred Worker Selection
    A->>B: POST /api/v1/admin/requests/:id/quotes/:quoteId/select
    B->>DB: Mark quote selected, Status = WORKER_SELECTED (NOT assigned)

    Note over A,C: Stage 5: Customer Quotation Generation
    A->>B: POST /api/v1/admin/requests/:id/customer-quote
    Note over B: Math Verification:<br/>total = labour + material + inspection + additional - discount
    B->>DB: Save customer_quotations, Status = CUSTOMER_APPROVAL_PENDING
    B->>C: Notification: "Quotation ready for review"

    Note over C,DB: Stage 6: Customer Decision
    C->>B: POST /api/v1/requests/:id/customer-decision (action: accept/decline)
    B->>DB: Status = CUSTOMER_CONFIRMED (or CUSTOMER_DECLINED)

    Note over A,DB: Stage 7: Technician Assignment Guard
    Note over B: Guard Rule: Pre-confirmation assignment strictly blocked!
    A->>B: POST /api/v1/admin/requests/:id/confirm-assignment
    B->>DB: Status = ASSIGNED, Insert assignments record

    Note over C,A: Stage 8: Service Delivery & Completion
    A->>B: PATCH /api/v1/admin/requests/:id/status (IN_PROGRESS -> COMPLETED)
    B->>DB: Status = COMPLETED
```

---

## 4. Privacy & Security Rules

1. **Customer Data Masking**: WhatsApp job messages strip house/flat numbers and customer phone numbers. Only problem description, service category, and general neighborhood/city are broadcast.
2. **Worker Portal Elimination**: In accordance with platform governance, there is no worker portal, worker login, or worker app. Technician engagement is conducted via WhatsApp and phone dispatch.
3. **Public Worker Application**: Prospective technicians apply via public Become a Worker form (`/become-a-worker`). Submissions are saved as `PENDING` in `worker_applications`. Admin review creates a record in `workers` without credentials.
4. **Assignment Guard**: The backend strictly blocks assigning a technician prior to customer confirmation (`CUSTOMER_CONFIRMED`).
