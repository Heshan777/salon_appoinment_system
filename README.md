# 💈 SalonSync – Cloud-Based Salon Appointment Management System
### ITS4243 – Microservices and Cloud Computing | Assignment 01
**Student Index Numbers:** `ICT/22/946` | `ICT/22/941` | `ICT/22/846`  
**Domain:** Beauty and Personal Care Services  

---

## 📖 Executive Summary & Academic Alignment
**SalonSync** is a distributed, containerized microservices platform deployed to cloud infrastructure. Built to solve double-bookings, manual scheduling confusion, and untracked payments in traditional beauty parlors and salons, the system strictly implements a decoupled, cloud-ready microservices architecture with an API Gateway, real-time database persistence with MongoDB Atlas and Supabase, and autonomous AI scheduling capabilities.

### Microservices Directory (8 Services)

| Microservice | Port | Description | Architecture / Datastore |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `5000` | Unified entry point, reverse proxy, CORS & route dispatching | Express / `http-proxy-middleware` |
| **Auth Service** | `5001` | JWT identity management & RBAC for Customers, Staff, and Owners | **Supabase** / Cryptographic JWT |
| **Booking Service** | `5002` | Appointment scheduling, calendar reservation & conflict engine | **MongoDB Atlas** (`salon_bookings`) |
| **Catalog Service** | `5003` | Treatment catalog, pricing master data, and staff roster | **MongoDB Atlas** (`salon_catalog`) |
| **Payment Service** | `5004` | Advance deposits, transaction ledger, and refund engine | In-memory ledger / Stripe-ready |
| **Notification Service** | `5005` | Real-time SMS & Email dispatch for booking events and reminders | Asynchronous Event Dispatcher |
| **AI Assistant / Agent** | `5006` | Autonomous conversational concierge & multi-turn tool calling | **Google Gemini AI** (`gemini-3.8-flash`) |
| **Inventory Service** | `5007` | Stock management, low-supply alerts & treatment consumables | Central Warehouse Ledger |

---

## 🎯 Target Users & 5 Core Business Scenarios Satisfaction

| Assignment Scenario | Target Actors | Core Microservices | Implementation Status |
| :--- | :--- | :--- | :---: |
| **Scenario 01: Customer Books an Appointment** | Customer | `catalog-service` (5003), `booking-service` (5002) | ✅ **100% Satisfied** |
| **Scenario 02: Salon Owner Manages Services** | Salon Owner / Admin | `catalog-service` (5003) | ✅ **100% Satisfied** |
| **Scenario 03: Salon Staff Manages Appointments** | Salon Staff, Specialist | `booking-service` (5002), `inventory-service` (5007) | ✅ **100% Satisfied** |
| **Scenario 04: Customer Makes a Payment** | Customer, Owner | `payment-service` (5004), `booking-service` (5002) | ✅ **100% Satisfied** |
| **Scenario 05: Customer Receives Notifications** | Customer, Staff | `notification-service` (5005) | ✅ **100% Satisfied** |

---

## 🏗️ Architecture Overview

```
                                [ Client Browser / Web UI / Postman ]
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │    API Gateway (:5000)    │
                                    │   (Reverse Proxy / CORS)  │
                                    └─────────────┬─────────────┘
                                                  │
    ┌────────────────┬────────────────────┬───────┴───────────┬───────────────────┬────────────────┬────────────────┐
    ▼                ▼                    ▼                   ▼                   ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────────────┐ ┌────────────────────┐ ┌──────────────┐ ┌───────────────┐
│ Auth Service │ │Booking Service││Catalog Service│ │Payment Service │ │Notification Service│ │AI Assistant  │ │Inventory Svc  │
│    (:5001)   │ │   (:5002)    │ │    (:5003)    │ │    (:5004)     │ │      (:5005)       │ │   (:5006)    │ │    (:5007)    │
└──────┬───────┘ └──────┬───────┘ └───────┬───────┘ └────────────────┘ └────────────────────┘ └──────┬───────┘ └───────────────┘
       │                │                 │                                                            │
  [Supabase]      [MongoDB Atlas]   [MongoDB Atlas]                                              [Google Gemini]
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: v18+ or v20+
- **npm**: v9+
- *(Optional)* **Docker & Docker Compose**

### 1. Setup Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in your credentials (e.g. `GEMINI_API_KEY`, `MONGODB_URI`, `SUPABASE_URL`) if testing against live cloud instances. *Note: All services feature automatic in-memory fallback datasets if cloud credentials are not supplied yet, ensuring zero friction during local development.*

### 2. Install Dependencies
Install dependencies for all microservice workspaces:
```bash
npm run install:all
```

### 3. Run Microservices Locally
You can run services individually or in parallel:
```bash
# In separate terminal tabs or concurrently:
npm run dev:gateway      # Port 5000
npm run dev:auth         # Port 5001
npm run dev:booking      # Port 5002
npm run dev:catalog      # Port 5003
npm run dev:payment      # Port 5004
npm run dev:notification # Port 5005
npm run dev:ai           # Port 5006
```

### 4. Run with Docker Compose
To spin up all microservices and a local MongoDB instance in unified containers:
```bash
docker-compose up --build
```

### 5. Run the Web Dashboard
The responsive Maison salon operations dashboard is available in the `web/` workspace:
```bash
npm run dev:web
```
Open [http://localhost:5173](http://localhost:5173). Start the API services first so appointments and catalog data are loaded through the API Gateway at `http://localhost:5000`.

---

## 📡 API Endpoints Reference

All requests can be routed through the **API Gateway** (`http://localhost:5000`) or sent directly to each individual service port.

### 1. API Gateway
- `GET /health` - Overall system route & health status

### 2. Auth Service (`/api/auth`)
- `POST /api/auth/register` - Create customer or staff account
- `POST /api/auth/login` - Sign in and receive auth token
- `GET /api/auth/profile` - Protected route validating user token

### 3. Catalog & Staff Service (`/api/catalog`)
- `GET /api/catalog/services` - List all salon services (Haircut, Skincare, Nails, etc.)
- `POST /api/catalog/services` - Add a new salon service
- `GET /api/catalog/staff` - List stylists & specialties
- `POST /api/catalog/staff` - Add a stylist profile

### 4. Booking Service (`/api/bookings`)
- `GET /api/bookings` - List appointments (supports `?customerEmail=`, `?staffId=`, `?status=`)
- `GET /api/bookings/:id` - Fetch single appointment
- `POST /api/bookings` - Book an appointment (performs conflict checking)
- `PATCH /api/bookings/:id/status` - Update status (`confirmed`, `completed`, `cancelled`)

### 5. Payment Service (`/api/payments`)
- `POST /api/payments/checkout` - Create checkout transaction
- `GET /api/payments/transactions/:appointmentId` - Query transaction receipts

### 6. Notification Service (`/api/notifications`)
- `POST /api/notifications/send-confirmation` - Trigger SMS/Email booking confirmation
- `POST /api/notifications/send-reminder` - Trigger appointment reminder
- `GET /api/notifications/logs` - View dispatched message history

### 7. Gemini AI Assistant Service (`/api/ai`)
- `POST /api/ai/chat` - Conversational concierge for service & styling recommendations
- `POST /api/ai/agent` - Autonomous Multi-Turn Tool Calling Orchestrator
- `POST /api/ai/parse-intent` - Autonomous NLP slot extraction (turns raw prompts like *"I want a haircut with Sarah tomorrow at 3pm"* into structured booking JSON)
- `POST /api/ai/tools/execute` - Direct microservice tool execution

### 8. Inventory & Consumables Service (`/api/inventory`)
- `GET /api/inventory/health` - Inventory microservice health check
- `GET /api/inventory` - Central product stock levels, inventory valuation & low-stock alerts
- `POST /api/inventory/consume` - Deduct consumables (e.g., hair toner, keratin, scalp oil) upon service completion
- `POST /api/inventory/restock` - Add supply quantities to warehouse items
- `GET /api/inventory/logs` - Audit history of consumed salon products

---

## 🧪 Postman Collection & Testing

Pre-configured Postman assets are located in the `postman/` directory:
- [salon_management_system.postman_collection.json](file:///d:/projects/salon_management_system/postman/salon_management_system.postman_collection.json)
- [salon_management_system.postman_environment.json](file:///d:/projects/salon_management_system/postman/salon_management_system.postman_environment.json)

**How to Import:**
1. Open **Postman**.
2. Click **Import** and select the two JSON files in `postman/`.
3. Set your active environment to **"Salon Management System"**.
4. Run individual requests or execute the entire collection with the Postman Collection Runner.

---

## ☁️ Cloud Infrastructure & Deployment

### Render Deployment (Blueprint)
The repository includes a ready-to-deploy [render.yaml](file:///d:/projects/salon_management_system/render.yaml) file.
1. Connect your GitHub repository to [Render.com](https://render.com).
2. Choose **New > Blueprint**.
3. Select this repository; Render will parse `render.yaml` and provision all 7 microservices with inter-service networking and environment variables automatically.

### Terraform Provisioning
Infrastructure scripts are provided under `infrastructure/terraform/`:
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```
Provisions your MongoDB Atlas M0 cluster and Render cloud configurations.

### Ansible Configuration Management
Playbooks are provided under `infrastructure/ansible/`:
```bash
cd infrastructure/ansible
ansible-playbook -i inventory.ini playbook.yml
```
Automates server setup, Docker runtime installation, and project stack deployment on cloud hosts.
