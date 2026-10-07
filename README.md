# 💈 Salon Management System (Cloud-Native Microservices)

A distributed, containerized microservices architecture built with **Node.js**, **Docker**, **Render**, **MongoDB Atlas**, **Supabase**, and **Google Gemini AI**.

---

## 🏗️ Architecture Overview

The system is partitioned into autonomous microservices connected through an **API Gateway** reverse proxy:

```
                            [ Client / Postman / Web UI ]
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │    API Gateway (:5000)    │
                            │   (Reverse Proxy / CORS)  │
                            └─────────────┬─────────────┘
                                          │
    ┌────────────────┬────────────────────┼───────────────────┬────────────────┐
    ▼                ▼                    ▼                   ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌────────────────┐ ┌──────────────┐
│ Auth Service │ │Booking Service││Catalog Service│ │Payment Service │ │AI Assistant  │
│    (:5001)   │ │   (:5002)    │ │    (:5003)    │ │    (:5004)     │ │   (:5006)    │
└──────┬───────┘ └──────┬───────┘ └───────┬───────┘ └────────────────┘ └──────┬───────┘
       │                │                 │                                    │
  [Supabase]      [MongoDB Atlas]   [MongoDB Atlas]                      [Google Gemini]
```

### Microservices Directory

| Microservice | Port | Description | Database / Provider |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `5000` | Single entry point, routing, rate-limiting & reverse proxy | None |
| **Auth Service** | `5001` | User registration, authentication, RBAC (customer, stylist, admin) | **Supabase** & JWT fallback |
| **Booking Service** | `5002` | Appointments, calendar slots, conflict detection | **MongoDB Atlas** (`Appointment`) |
| **Catalog Service** | `5003` | Salon services, category pricing, staff availability | **MongoDB Atlas** (`Service`, `Staff`) |
| **Payment Service** | `5004` | Transactions, checkout processing, invoice status | Stripe / Mock Transaction Ledger |
| **Notification Service** | `5005` | SMS & Email dispatching for booking confirmations & reminders | Event Logger / SMTP |
| **AI Assistant** | `5006` | Smart scheduling concierge & intent/slot entity extraction | **Google Gemini AI** (`@google/genai`) |

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
- `POST /api/ai/parse-intent` - Autonomous NLP slot extraction (turns raw prompts like *"I want a haircut with Sarah tomorrow at 3pm"* into structured booking JSON)

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
