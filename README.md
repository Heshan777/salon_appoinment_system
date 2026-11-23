# 💈 SalonSync – Cloud-Native Salon Appointment & Resource Management Platform
### ITS4243 – Microservices and Cloud Computing | Assignment 01
**Student Index Numbers:** `ICT/22/946` | `ICT/22/941` | `ICT/22/846`  
**Domain:** Beauty and Personal Care Services  
**Deployment Status:** ✅ **Production Ready** (Containerized • CI/CD Verified • 100% QA Pass)

---

## 📖 Executive Summary & Academic Alignment
**SalonSync** is a production-grade, distributed microservices platform deployed to cloud infrastructure. Built to eliminate double-bookings, manual phone scheduling chaos, and fragmented financial reconciliation in modern beauty salons and spas, the system implements a decoupled cloud-native architecture with an API Gateway, real-time database persistence (MongoDB Atlas & Supabase), cryptographic JWT access controls, central inventory consumables tracking, and autonomous AI scheduling powered by **Google Gemini**.

### Microservices Topology (8 Decoupled Services)

| Microservice | Port | Primary Responsibility | Architecture / Datastore |
| :--- | :---: | :--- | :--- |
| **API Gateway** | `5000` | Unified entry point, reverse proxy, rate limiting, request correlation & SPA static serving | Express / `http-proxy-middleware` / Helmet |
| **Auth Service** | `5001` | JWT identity management & RBAC for 4 Target Actors (Client, Stylist, Desk, Owner) | **Supabase** / Cryptographic JWT |
| **Booking Service** | `5002` | Appointment scheduling, calendar reservation & real-time conflict prevention engine | **MongoDB Atlas** (`salon_bookings`) |
| **Catalog Service** | `5003` | Treatment catalog, pricing master data, and staff shift rosters | **MongoDB Atlas** (`salon_catalog`) |
| **Payment Service** | `5004` | Advance deposits, transaction ledger, and refund engine | In-memory ledger / Stripe-ready |
| **Notification Service** | `5005` | Real-time SMS & Email dispatch for booking events and reminders | Asynchronous Event Dispatcher |
| **AI Assistant / Agent** | `5006` | Autonomous conversational concierge & multi-turn tool calling | **Google Gemini AI** (`gemini-2.5-flash`) |
| **Inventory Service** | `5007` | Stock management, low-supply alerts & treatment consumables deduction | Central Warehouse Ledger |

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
 └──────┬───────┘ └──────┬───────┘ └────────┬───────┘ └────────────────┘ └────────────────────┘ └──────┬───────┘ └───────────────┘
        │                │                  │                                                           │
   [Supabase]     [MongoDB Atlas]    [MongoDB Atlas]                                              [Google Gemini]
   Auth/Postgres  `salon_bookings`   `salon_catalog`                                              AI Model APIs
```

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
