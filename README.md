# 💈 SalonSync – Cloud-Native Salon Appointment & Resource Management Platform
### ITS4243 – Microservices and Cloud Computing | Assignment 01
**Student Index Numbers:** `ICT/22/946` | `ICT/22/941` | `ICT/22/846`  
**Domain:** Beauty and Personal Care Services  
**Deployment Status:** ✅ **Production Ready** (Containerized • CI/CD Verified • 100% QA Pass)

---

## 📖 Executive Summary & Academic Alignment
**SalonSync** is a production-grade, distributed microservices platform deployed to cloud infrastructure. Built to eliminate double-bookings, manual phone scheduling chaos, and fragmented financial reconciliation in modern beauty salons and spas, the system implements a decoupled cloud-native architecture with an API Gateway, real-time database persistence (MongoDB Atlas & Supabase), cryptographic JWT access controls, central inventory consumables tracking, and autonomous AI scheduling powered by **Google Gemini**.

### Microservices Topology (8 Decoupled Services)

| Microservice | Port | Primary Responsibility | Architecture / Dedicated Datastore |
| :--- | :---: | :--- | :--- |
| **API Gateway** | `5000` | Unified reverse proxy, rate limiting, request correlation & SPA static serving | Express / `http-proxy-middleware` / Helmet / Distributed Tracing |
| **Auth Service** | `5001` | JWT identity management & singleton owner constraint | **Supabase (PostgreSQL)** (`salon_auth` / profiles & RBAC) |
| **Booking Service** | `5002` | Appointment scheduling, calendar reservation & conflict prevention | **MongoDB Atlas** (`salon_bookings` / `appointments` collection) |
| **Catalog Service** | `5003` | Treatment catalog, pricing master data, and staff shift rosters | **MongoDB Atlas** (`salon_catalog` / `services` & `staff` collections) |
| **Payment Service** | `5004` | Advance deposits, digital receipts, and refund engine | **MongoDB Atlas** (`salon_payments` / `transactions` collection) |
| **Notification Service** | `5005` | Real-time SMS & Email dispatch for booking events and reminders | **MongoDB Atlas** (`salon_notifications` / `dispatch_logs` collection) |
| **AI Assistant / Agent** | `5006` | Autonomous conversational concierge & multi-turn tool calling | **Google Gemini Cloud AI** (`gemini-2.5-flash` + context cache) |
| **Inventory Service** | `5007` | Stock management, low-supply alerts & consumables deduction | **MongoDB Atlas** (`salon_inventory` / `stock_items` & `consumption_logs`) |

---

## 🎯 Target Users & 5 Core Business Scenarios

| Assignment Scenario | Target Actors | Core Microservices Involved | Production Status |
| :--- | :--- | :--- | :---: |
| **Scenario 01: Customer Books an Appointment** | Customer / Client | `catalog-service` (5003), `booking-service` (5002) | ✅ **Production Ready** |
| **Scenario 02: Salon Owner Manages Services** | Salon Owner / Admin | `catalog-service` (5003) | ✅ **Production Ready** |
| **Scenario 03: Salon Staff Manages Appointments** | Salon Staff, Specialist | `booking-service` (5002), `inventory-service` (5007) | ✅ **Production Ready** |
| **Scenario 04: Customer Makes a Payment** | Customer, Owner | `payment-service` (5004), `booking-service` (5002) | ✅ **Production Ready** |
| **Scenario 05: Real-Time Reminders & Notifications** | Customer, Staff | `notification-service` (5005) | ✅ **Production Ready** |

---

## 🏗️ Cloud-Native Microservices Architecture

```
                                 [ Client Browser / Web UI / Mobile / Postman ]
                                                       │
                                                       ▼
                                         ┌───────────────────────────┐
                                         │    API Gateway (:5000)    │
                                         │  (Helmet / Rate Limiting) │
                                         │  (Distributed Tracing)    │
                                         └─────────────┬─────────────┘
                                                       │
        ┌────────────────┬───────────────────┬─────────┴─────────┬───────────────────┬────────────────┬────────────────┐
        ▼                ▼                   ▼                   ▼                   ▼                ▼                ▼
 ┌──────────────┐ ┌──────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐ ┌──────────────┐ ┌───────────────┐
 │ Auth Service │ │Booking Svc   │ │Catalog Service │ │Payment Service │ │Notification Service│ │AI Assistant  │ │Inventory Svc  │
 │   (:5001)    │ │   (:5002)    │ │    (:5003)     │ │    (:5004)     │ │      (:5005)       │ │   (:5006)    │ │    (:5007)    │
 └──────┬───────┘ └──────┬───────┘ └────────┬───────┘ └────────┬───────┘ └─────────┬──────────┘ └──────┬───────┘ └───────┬───────┘
        │                │                  │                  │                   │                   │                 │
        ▼                ▼                  ▼                  ▼                   ▼                   ▼                 ▼
   [Supabase]     [MongoDB Atlas]    [MongoDB Atlas]    [MongoDB Atlas]     [MongoDB Atlas]     [Google Gemini]   [MongoDB Atlas]
  Postgres DB     `salon_bookings`   `salon_catalog`    `salon_payments`    `salon_notifs`       Cloud AI Cache   `salon_inventory`
 (Users & RBAC)    (Appointments)     (Treatments)        (Transactions)     (Dispatch Logs)      (Intent Memory)   (Stock & Supplies)
```

### 🗄️ Database-per-Service Pattern (Decoupled Polyglot Persistence)
In strict alignment with the **Database-per-Service** design pattern required for enterprise microservices architectures:
1. **Zero Cross-Service Database Coupling**: No microservice is permitted to access another service's database directly. All cross-domain collaboration occurs exclusively via well-defined RESTful HTTP APIs orchestrated through the API Gateway.
2. **Polyglot Persistence**: Datastores are specialized according to the computational and domain needs of each microservice:
   - **Auth Service**: Relational **PostgreSQL / Supabase** for user credentials, cryptographic salts, and role-based access control (RBAC).
   - **Booking Service**: Document-oriented **MongoDB Atlas** (`salon_bookings`) for dynamic appointment scheduling and calendar conflict indexing.
   - **Catalog Service**: Document-oriented **MongoDB Atlas** (`salon_catalog`) for high-throughput read operations across salon treatments and specialist schedules.
   - **Payment Service**: Transactional **MongoDB Atlas** (`salon_payments`) maintaining an immutable financial ledger and refund audit trail.
   - **Notification Service**: Event-driven **MongoDB Atlas** (`salon_notifications`) recording customer dispatch telemetry (SMS/Email logs).
   - **Inventory Service**: Warehouse ledger **MongoDB Atlas** (`salon_inventory`) tracking real-time consumable levels and deduct-on-service events.
   - **AI Assistant**: Stateless **Google Gemini 2.5 Flash** orchestrator utilizing ephemeral conversational context memory.
3. **Resilient Local Fallback Engine**: Every microservice incorporates an automated circuit-breaker fallback. If a cloud database connection is temporarily interrupted, the service automatically serves local mock/in-memory records to guarantee 100% uptime without cascading system failures.

---

## 🛡️ Production Readiness & Security Features

1. **Enterprise Security & Rate Limiting**:
   - `helmet` security headers configured on the public gateway to prevent XSS, clickjacking, and MIME-sniffing.
   - Built-in sliding-window rate limiter on `/api/auth/*` routes preventing credential-stuffing and brute-force attacks.
2. **Distributed Tracing & Correlation IDs**:
   - Every request is tagged with an `X-Request-Id` UUID, propagated through the reverse proxy to downstream microservices and logged in server outputs.
3. **Graceful Zero-Downtime Shutdown**:
   - Handlers for `SIGTERM` and `SIGINT` across all 8 microservices ensure in-flight HTTP requests and database sockets close gracefully before process termination.
4. **Resilient In-Memory Fallbacks**:
   - If cloud databases (MongoDB Atlas, Supabase) or external APIs (Stripe, Gemini) are temporarily offline, services automatically transition to in-memory datasets with full CRUD, calendar conflict validation, and tool-calling execution.

---

## 🚀 Quickstart & Deployment

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+
- *(Optional)* **Docker & Docker Compose**

### 2. Environment Configuration
Copy the template and configure your secrets:
```bash
cp .env.example .env
```

### 3. Run Locally (All 8 Services in Parallel)
```bash
npm run dev
```
Open **[http://localhost:5000](http://localhost:5000)** to access the platform.

### 4. Build and Run via Docker Compose
To build and spin up all 8 microservices and an isolated MongoDB container:
```bash
docker-compose up --build
```

### 5. Automated QA Test Suite (100% Pass Rate)
Execute the complete end-to-end integration and health verification test suite:
```bash
npm test
```
*Outputs 36/36 automated integration tests validating health, auth, bookings, conflicts, payments, notifications, AI tool calling, and inventory deduction.*

---

## 📡 API Endpoints Reference

All requests route through the **API Gateway** (`http://localhost:5000`):

### 1. API Gateway
- `GET /health` - Overall system health, uptime, and registered service routing table

### 2. Auth Service (`/api/auth`)
- `POST /api/auth/register` - Create an account with role assignment (`customer`, `stylist`, `receptionist`, `admin`)
- `POST /api/auth/login` - Authenticate credentials and receive cryptographic JWT
- `GET /api/auth/profile` - Protected profile route validating JWT Bearer token

### 3. Catalog & Staff Service (`/api/catalog`)
- `GET /api/catalog/services` - List all treatment categories (Hair, Skincare, Nails, Bridal, Massage)
- `POST /api/catalog/services` - Register new treatment with duration and pricing
- `GET /api/catalog/staff` - List stylists, shift schedules, and specialties
- `POST /api/catalog/staff` - Add stylist profile to roster

### 4. Booking & Scheduling Service (`/api/bookings`)
- `GET /api/bookings` - List bookings (supports `?customerEmail=`, `?staffId=`, `?status=`)
- `POST /api/bookings` - Create booking (automatically validates double-booking conflicts within time window)
- `PATCH /api/bookings/:id/status` - Transition status (`pending`, `confirmed`, `completed`, `cancelled`)
- `DELETE /api/bookings/:id` - Cancel and delete appointment

### 5. Payment Service (`/api/payments`)
- `POST /api/payments/checkout` - Process advance deposit or full service fee
- `GET /api/payments/transactions` - Query global financial transactions ledger
- `GET /api/payments/transactions/:appointmentId` - Query transaction receipts by booking
- `POST /api/payments/refund` - Process customer refund

### 6. Notification Service (`/api/notifications`)
- `POST /api/notifications/send-confirmation` - Dispatch SMS and Email appointment confirmation
- `POST /api/notifications/send-cancellation` - Dispatch cancellation notification
- `GET /api/notifications/logs` - Retrieve dispatch audit log

### 7. Gemini AI Assistant Service (`/api/ai`)
- `POST /api/ai/chat` - Conversational salon concierge for styling advice
- `POST /api/ai/parse-intent` - Autonomous NLP slot extraction (converts unstructured text to booking JSON)
- `POST /api/ai/agent` - Multi-turn Autonomous Agent with live microservice tool calling
- `POST /api/ai/tools/execute` - Direct execution engine for registered microservice tools

### 8. Inventory & Consumables Service (`/api/inventory`)
- `GET /api/inventory/health` - Inventory microservice health check
- `GET /api/inventory` - Current warehouse stock levels, stock valuation, and low-threshold alerts
- `POST /api/inventory/consume` - Deduct consumables (toner, keratin, argan oil) upon appointment checkout
- `POST /api/inventory/restock` - Add product quantities to inventory
- `GET /api/inventory/logs` - Audit trail of consumed treatment supplies

---

## ☁️ Cloud Deployment Blueprints

### Render (Blueprint Deploy)
The repository contains a multi-service [render.yaml](file:///d:/projects/salon_management_system/render.yaml) file. Connect your GitHub repository to [Render.com](https://render.com) and select **New Blueprint** to provision the entire 8-microservice stack automatically.

### Terraform & Ansible
- **Terraform** (`infrastructure/terraform/`): Declarative infrastructure files provisioning MongoDB Atlas clusters and Render cloud resources.
- **Ansible** (`infrastructure/ansible/`): Automated playbooks for cloud server provisioning, Docker runtime setup, and containerized deployment.

### Continuous Integration (CI/CD)
GitHub Actions workflow configured at [`.github/workflows/ci.yml`](file:///d:/projects/salon_management_system/.github/workflows/ci.yml) validates:
- Syntax and lint checks across all 8 microservices on every push.
- Web frontend production build verification via Vite.
