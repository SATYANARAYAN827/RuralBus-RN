  # 🚌 RuralBus Cloud Deployment & Architecture Documentation

## 1. System Overview

RuralBus is an enterprise multi-tenant rural transit operations platform built with **React Native (Web & Mobile)**, **Fastify (Node.js/TypeScript REST & WebSocket API)**, and **PostgreSQL (with PostGIS geospatial extensions)**.

```mermaid
graph TD
    A[Commuter / Staff Mobile & Web] -->|HTTPS / WSS| B[Vercel Global Edge CDN]
    A -->|API Requests & Real-time GPS| C[Render Backend API]
    B -->|Frontend Bundle| A
    C -->|Drizzle ORM / SQL| D[(Neon PostgreSQL Cloud DB)]
    E[GitHub Repository] -->|Auto CI/CD on Git Push| B
    E -->|Auto Webhook Deploy| C
```

---

## 2. Live Cloud Endpoints

| Service | Provider | Region | Live URL |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | Global Edge (Anycast) | **[https://ruralbus.vercel.app](https://ruralbus.vercel.app)** |
| **Backend API Engine** | **Render** | Singapore (`ap-southeast-1`) | **[https://ruralbus-rn.onrender.com](https://ruralbus-rn.onrender.com)** |
| **PostgreSQL Database** | **Neon** | Singapore (`ap-southeast-1`) | `ep-dawn-base-b3x13eeg-pooler...` |
| **Source Code Repository**| **GitHub** | Cloud | **[SATYANARAYAN827/RuralBus-RN](https://github.com/SATYANARAYAN827/RuralBus-RN)** |

---

## 3. Pre-Seeded Test Accounts & Credentials

All accounts are active on the live cloud database with the default password: **`Password123!`**

| Role | Phone Number | Password | Name / Organization | Scope & Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Super Admin** | `9876500000` | `Password123!` | State Transport Super Admin | Multi-tenant governance, operator approvals, platform audit logs |
| **Operator Admin** | `9861465410` | `Password123!` | Satya Demo Travel | Fleet dispatch, driver/conductor rostering, revenue analytics |
| **Driver** | `9876543202` | `Password123!` | Bishnu Charan Sahoo | Real-time GPS HUD, trip execution, live traffic tracking (Bus: `11-AA-0000`) |
| **Conductor** | `9876543203` | `Password123!` | Demo Conductor | QR ticket scanning, offline cash ticketing & shift settlement |
| **Passenger / Commuter** | `7381319957` | `Password123!` | Rahul Sharma | Route discovery, live bus radar, digital seat reservation |

---

## 4. How the Lifetime Free Tier Works ($0 / Month)

Your infrastructure is hosted across the following free-tier allowances:

### A. Vercel (Frontend Hosting)
- **Tier:** Hobby Plan (Free forever).
- **Limits:** 100 GB bandwidth per month, unlimited deployments, automatic HTTPS SSL certificates.
- **Cold Start:** **0 ms (Instant)** — Served directly from global CDN edge caches.

### B. Neon.tech (Database Hosting)
- **Tier:** Serverless Free Tier.
- **Limits:** 0.5 GiB NVMe storage, autoscaling up to 2 Compute Units, zero expiration date.
- **Storage Capacity:** Holds over 50,000+ bookings, trip trajectories, logs, and user accounts.

### C. Render.com (Backend API)
- **Tier:** Free Web Service.
- **Limits:** 750 free instance hours every month (runs 24/7 the entire month).
- **Sleep / Wake Behavior:**
  - After 15 minutes of inactivity, Render puts the container to sleep to save free hours.
  - When a user opens `https://ruralbus.vercel.app` or sends an API request, Render automatically **wakes up within ~30–45 seconds**.
  - Once awake, all requests respond instantly with 0 delay.

---

## 5. Maintenance & Automatic CI/CD Workflow

Whenever you make code modifications on your computer, both Vercel and Render deploy automatically upon `git push`:

```powershell
# 1. Stage and commit your changes
git add .
git commit -m "feat: updated dashboard features"

# 2. Push to GitHub
git push origin feature/module-7-super-admin:main
git push origin feature/module-7-super-admin
```

- **Vercel** automatically rebuilds the web app in ~45 seconds.
- **Render** automatically redeploys the Fastify backend in ~60 seconds.

---

## 6. Running Database Migrations on Neon

If you modify table schemas in `packages/database/src/schema/`, run migrations directly against the cloud database:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_zQJy2aSd4gZw@ep-dawn-base-b3x13eeg-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
pnpm db:migrate
```

---

## 7. Mobile Android APK Testing

To build a standalone installable `.apk` for Android phones:

1. Configure EAS CLI:
   ```powershell
   npx eas login
   npx eas build -p android --profile preview
   ```
2. Download the generated `.apk` file directly to your Android device.
3. The APK connects securely to `https://ruralbus-rn.onrender.com` over 4G/5G mobile data.
