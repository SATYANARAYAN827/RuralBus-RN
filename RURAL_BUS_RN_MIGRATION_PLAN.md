# RURALBUS REACT NATIVE - MASTER UI MIGRATION PLAN
**Document Status:** Approved Visual Baseline & Inventory  
**Old Project Location (Untouched Golden Source):** `c:\Users\admin\OneDrive\Documents\RURAL BUS`  
**New RN Project Location (UI Only):** `c:\Users\admin\OneDrive\Documents\RURAL BUS RN`  
**External Read-Only Backup Location:** `c:\Users\admin\OneDrive\Documents\RURAL_BUS_BACKUP_EXTERNAL`  
**Authoritative Backend:** `http://localhost:4000` (Fastify API from old project)  
**Creation Date:** September 2026  

---

## 1. Executive Summary & Migration Guardrails

### 1.1 Scope & Objective
This workspace (`RURAL BUS RN`) is dedicated **strictly to frontend UI migration**.
- Target Framework: **React Native + TypeScript** supporting **Android, iOS, and Web (React Native Web)**.
- Backend Integration: Connects directly to the existing Fastify API (`http://localhost:4000`) and WebSocket server (`ws://localhost:4000/ws/tracking`).
- **Zero Backend Duplication**: The backend code in `RURAL BUS/apps/api` and database schemas in `RURAL BUS/packages/database` remain the sole authoritative source of truth.
- **Old Project Untouched**: The old project in `c:\Users\admin\OneDrive\Documents\RURAL BUS` is completely preserved without modifications, commits, or pushes.

### 1.2 Visual Source of Truth Baseline
* **GOLDEN SOURCE OF TRUTH**: The running Capacitor application in `c:\Users\admin\OneDrive\Documents\RURAL BUS\apps\admin` is the **ONLY golden visual/UX source of truth**. Actual screenshots captured directly from this running application are stored in:
  `references/screenshots/capacitor/desktop/` (1440x900)
  `references/screenshots/capacitor/mobile/` (390x844)
* **REFERENCE / TARGET ONLY**: The existing React Native screenshots stored in:
  `references/screenshots/rn_reference/` (`rn-target-desktop-baseline.png`, `rn-target-passenger-home-mobile.png`)
  are **REFERENCE / TARGET ONLY** and are **NOT** the golden Capacitor baseline.

### 1.3 Non-Negotiable Invariants
1. **NO OLD PROJECT MODIFICATIONS**: Never edit, commit, push, or delete files in the old repository.
2. **SUPER ADMIN ZERO-TRACKING RULE**: The Super Admin dashboard (`PLATFORM_ADMIN`) must feature **zero** map components and **zero** live GPS tracking subscribers.
3. **APPROVED UI SOURCE OF TRUTH**: The visual design, layouts, typography, navigation, menus, and color schemes of the restored Capacitor UI in `apps/admin` represent the golden standard for all migrated React Native screens.
4. **POSTGRESQL & BACKEND AUTHORITY**: Frontend never assumes business logic or validates seats locally without authoritative backend validation.
5. **ZERO CLIENT TRUST FOR TENANT ID**: Frontend never supplies or tampers with tenant identifiers; authentication tokens alone convey authoritative claims.
6. **NO UNVERIFIED REPLACEMENT TECH**: Replacement libraries for native features (camera scanner, maps, background geolocation) must be verified and approved prior to adoption.

---

## 2. Old System Inventory & Architecture Audit

### 2.1 Workspace Structure of the Old Project
The existing project (`RURAL BUS`) is a Turborepo monorepo:
* `apps/admin`: React 19 + TypeScript + Vite + Tailwind CSS + Capacitor Android container (`android/`). Contains the complete approved frontend for all 5 roles.
* `apps/api`: Fastify 5 + TypeScript backend engine on port 4000 (Pino logger, WebSockets, rate limiters).
* `packages/database`: Drizzle ORM + PostgreSQL 16 + PostGIS (spatial types, RLS withTenant, seeds).
* `packages/shared-types`: Canonical domain types, DTOs, LiveVehicleState, enums.
* `packages/shared-validators`: Zod validation schemas for all API payloads.
* `packages/ui`: Design tokens and web primitives (Button, Card, Badge).

---

## 3. Complete Screen & Module Inventory (45 Distinct Views)

A comprehensive audit of the approved UI in `apps/admin` reveals exactly **45 distinct UI screen/modal view states** distributed across 6 functional modules (captured in both Desktop 1440x900 and Mobile 390x844 viewports, totaling 90 screenshot artifacts):

### Module 1: Authentication & Identity (5 Screens)
1. **Screen 1.1: Login Screen (Light Theme)** (`auth_01_login_light`)
   - Inputs: Mobile Number / Email identifier, Password with show/hide toggle, "Remember Me" checkbox.
   - Actions: "Sign In to Account ➔" CTA, "Forgot Password?" trigger, "Create Passenger Account" link.
   - Responsive: Desktop left-aligned card with backdrop image; Mobile centered card.
2. **Screen 1.2: Login Screen (Dark Theme)** (`auth_02_login_dark`)
   - Dark theme styling with dark backdrop, high-contrast borders, and emerald accents.
3. **Screen 1.3: Language Selector Dropdown** (`auth_03_login_language_dropdown`)
   - Global dropdown: English (EN), Odia (OD), Hindi (HI).
4. **Screen 1.4: Passenger Registration (Step 1)** (`auth_04_register_step1`)
   - Inputs: Full Name, 10-digit Mobile Number, Email (optional), Password (min 6 chars).
   - Action: "Send Verification OTP →" CTA.
5. **Screen 1.5: Account Recovery Modal (Forgot Password)** (`auth_05_forgot_password_modal`)
   - Step A (PHONE): 10-digit mobile number input, "Send 6-Digit OTP ➔" CTA.
   - Step B (OTP): 6-digit verification code, 5-minute timer, test OTP autofill.
   - Step C (PASSWORD): New password + Confirm new password.

### Module 2: Passenger Portal (11 Screens)
6. **Screen 2.1: Passenger Home (Light Theme)** (`passenger_01_home_light`)
   - Header: Brand wordmark `RURAL` + `BUS`, Passenger pill badge, "Current Location" pill.
   - Hero Search Card: FROM and TO stop inputs with reverse swap button (⇅), DATE OF JOURNEY selector with "Today" and "Tomorrow" quick chips, green "Find Available Buses" button.
   - Quick Payments & Passes: 3-card grid (Daily Bus Pass, Metro Card recharge, Student Pass).
7. **Screen 2.2: Passenger Home (Dark Theme)** (`passenger_02_home_dark`)
   - Dark theme variation of the passenger home screen.
8. **Screen 2.3: Bus Discovery & Search Form** (`passenger_03_find_bus_search`)
   - Route search inputs and corridor selection.
9. **Screen 2.4: Search Results & Corridor Listing** (`passenger_04_find_bus_results`)
   - Filter bar: Operator filter, departure time slots (Morning, Afternoon, Evening), AC / Non-AC.
   - Trip Cards: Operator badge, route code, departure/arrival timestamps, travel duration, available seats, fare.
10. **Screen 2.5: Interactive Seat Selection Grid** (`passenger_05_seat_selection_modal`)
    - Bus cabin representation with driver cabin indicator, 2x2 / 3x2 grid, aisle.
    - Seat states: AVAILABLE (white/emerald border), SELECTED (emerald filled), BOOKED (gray), HELD (amber).
    - Summary footer: Selected seat numbers, total fare tally, "Hold Seat & Proceed to Pay" action.
11. **Screen 2.6: Digital Ticket Wallet** (`passenger_06_my_tickets`)
    - Active Journeys: Upcoming departure, bus registration, seat number.
    - Quick Action: "Track Live Bus 📡" button launching live tracking.
12. **Screen 2.7: Ticket Ed25519 QR Code Modal** (`passenger_07_ticket_qr_modal`)
    - Cryptographically signed Ed25519 QR code, booking ID, passenger name.
13. **Screen 2.8: Commuter Profile & Utilities Menu** (`passenger_08_profile_menu`)
    - Profile Overview: Avatar ring, full name, mobile number, completion progress bar.
    - Utilities roster: Bus stops near me, Change language, Themes, SOS, Customer support, Manage Consent, Account settings.
14. **Screen 2.9: SOS Emergency Modal** (`passenger_09_profile_sos_modal`)
    - Direct dialer for National Emergency 112 and Women's Transit Helpline.
15. **Screen 2.10: Bus Stops Near Me Modal** (`passenger_10_profile_nearby_stops_modal`)
    - Lists active transit stops within GPS radius with distance in meters/km.
16. **Screen 2.11: Mobile Drawer Navigation Open State** (`passenger_11_mobile_drawer_open`)
    - Drawer navigation menu toggled via hamburger button `[☰]`.

### Module 3: Driver Portal (6 Screens)
17. **Screen 3.1: Driver Duty Dashboard** (`driver_01_home`)
    - Duty Status Badge: ON DUTY / OFF DUTY.
    - Active Trip HUD: Route code, origin ➔ destination, scheduled departure, onboard passenger count.
    - Trip Lifecycle Buttons: "Start Trip" and "Complete Trip".
18. **Screen 3.2: Select Bus & Start Duty Modal** (`driver_02_select_bus_modal`)
    - Vehicle selector filtered to assigned bus, odometer check, "Start Duty Run" action.
19. **Screen 3.3: Turn-by-Turn Corridor Map** (`driver_03_map_radar`)
    - Fullscreen corridor map with live GPS position marker.
    - Telemetry HUD: Current speed odometer, compass heading, next milestone stoppage.
20. **Screen 3.4: Corridor Stoppages Checklist** (`driver_04_stops_checklist`)
    - Chronological stoppage list with planned arrival times (PASSED, CURRENT, UPCOMING).
21. **Screen 3.5: Completed Duty History** (`driver_05_history`)
    - Table/cards of finished trips: Date, route code, bus registration, duration, passenger count.
22. **Screen 3.6: Driver Profile** (`driver_06_profile`)
    - Driver employee credentials, driving license registration, assigned operator company, theme/language.

### Module 4: Conductor Portal (5 Screens)
23. **Screen 4.1: Conductor Duty Overview** (`conductor_01_home`)
    - Active trip manifest summary: Route, bus registration, total reserved seats vs vacant seats.
    - Pre-Departure Manifest Sync Button: Downloads full passenger roster into local storage.
24. **Screen 4.2: Camera QR Scanner** (`conductor_02_scan_qr`)
    - Camera viewfinder with target reticle, flashlight toggle, manual 8-character ticket code input.
    - Scan Result Overlays: VALID (green), DUPLICATE (red warning), INVALID (red error).
25. **Screen 4.3: Searchable Passenger Manifest** (`conductor_03_passenger_manifest`)
    - Filter tabs: ALL, BOARDED, WAITING.
    - Search input: Filter by passenger name, seat number, or ticket reference code.
26. **Screen 4.4: On-Bus Cash Ticketing POS** (`conductor_04_cash_tickets`)
    - Stoppage selector: Boarding stop ➔ Destination stop.
    - Fare Calculator: Auto-calculates ticket price based on corridor distance.
    - Action: "Issue Cash Ticket" generates serial number (TKT-...), prints/displays receipt.
27. **Screen 4.5: Conductor Profile** (`conductor_05_profile`)
    - Staff badge, depot allocation, cash collection summary, logout.

### Module 5: Fleet Owner / Operator Admin Portal (9 Screens)
28. **Screen 5.1: Operational Overview** (`owner_01_home`)
    - Metric cards: Total Fleet, Active Buses on Road, Scheduled Trips Today, Daily Online Revenue, Daily Cash Revenue.
29. **Screen 5.2: Fleet Inventory Management** (`owner_02_buses`)
    - Bus roster table: Registration number, model, seating layout, amenities, assigned driver/conductor, status.
30. **Screen 5.3: Add New Bus Modal** (`owner_03_add_bus_modal`)
    - Registration input, seating capacity, layout type (2x2 / 3x2), amenity checkboxes.
31. **Screen 5.4: Live Fleet Radar Map** (`owner_04_live_map`)
    - Fullscreen interactive map displaying live moving markers for all active company buses using Redis Geospatial coordinates.
32. **Screen 5.5: Staff Crew Management** (`owner_05_staff`)
    - Crew directory: Drivers and Conductors roster, phone numbers, active bus assignments.
33. **Screen 5.6: Route & Corridor Builder** (`owner_06_routes`)
    - Route builder: Origin, destination, corridor code, stop sequence editor, distance in km.
34. **Screen 5.7: Timetable Trip Dispatcher** (`owner_07_trips`)
    - Daily schedule creator: Departure time, arrival time, operating days, Bus + Driver + Conductor assignment.
35. **Screen 5.8: Financial Revenue Analytics** (`owner_08_revenue`)
    - Revenue summary: Total online Razorpay earnings, total conductor cash collections, route profitability.
36. **Screen 5.9: Operator Business Profile** (`owner_09_profile`)
    - Company details, business code, contact information, operating licenses, theme toggle.

### Module 6: Platform Admin / Super Admin Portal (9 Screens)
37. **Screen 6.1: State Platform Overview** (`superadmin_01_home`)
    - Platform KPIs: Total transport operators, active buses statewide, daily passenger volume.
    - **CRITICAL INVARIANT**: **ZERO MAP / ZERO TRACKING**.
38. **Screen 6.2: Transport Operator Directory** (`superadmin_02_owners`)
    - Operator table: Company name, business code, owner phone/email, fleet count, status.
39. **Screen 6.3: Provision Operator Company Modal** (`superadmin_03_register_owner_modal`)
    - Company name, business code, initial owner phone, temporary password.
40. **Screen 6.4: Master Vehicle Registry** (`superadmin_04_buses`)
    - Statewide bus registry across all operators.
41. **Screen 6.5: Master Staff Directory** (`superadmin_05_staff`)
    - Master directory of all drivers and conductors in the system.
42. **Screen 6.6: Inter-District Routes & Corridors** (`superadmin_06_routes`)
    - State highway corridors and approved regional transit lines.
43. **Screen 6.7: Statewide Timetable Overview** (`superadmin_07_trips`)
    - Global schedule calendar across all districts.
44. **Screen 6.8: Onboarding Requests Queue** (`superadmin_08_requests`)
    - Operator verification queue and bus/route permit audit.
45. **Screen 6.9: Platform Audit & Authority Profile** (`superadmin_09_profile`)
    - Security logs, system configuration, Super Admin credentials.

---

## 4. Master Index Mapping: Old Capacitor Screen ➔ Screenshot ➔ Navigation ➔ RN Target

| # | Old Capacitor Screen | Golden Screenshot (Desktop & Mobile) | Navigation / Action | RN Target Component |
|---|---|---|---|---|
| **AUTH MODULE** | | | | |
| 1 | `LoginView.tsx` (Light) | `auth_01_login_light.png` | Root fallback / Initial load | `src/screens/auth/LoginScreen.tsx` |
| 2 | `LoginView.tsx` (Dark) | `auth_02_login_dark.png` | TopHeader Theme Toggle (`☀️/🌙`) | `src/screens/auth/LoginScreen.tsx` |
| 3 | `LoginView.tsx` (Language) | `auth_03_login_language_dropdown.png` | TopHeader Language (`🌐`) | `src/components/LanguageSelectorModal.tsx` |
| 4 | `LoginView.tsx` (Register) | `auth_04_register_step1.png` | Click "Create Passenger Account" | `src/screens/auth/RegisterScreen.tsx` |
| 5 | `LoginView.tsx` (Forgot Password) | `auth_05_forgot_password_modal.png` | Click "Forgot Password?" | `src/screens/auth/ForgotPasswordModal.tsx` |
| **PASSENGER MODULE** | | | | |
| 6 | `PassengerApp.tsx` (Home Light) | `passenger_01_home_light.png` | Tab: `HOME` (Light theme) | `src/screens/passenger/PassengerHomeScreen.tsx` |
| 7 | `PassengerApp.tsx` (Home Dark) | `passenger_02_home_dark.png` | Tab: `HOME` + Theme Toggle | `src/screens/passenger/PassengerHomeScreen.tsx` |
| 8 | `PassengerApp.tsx` (Find Bus) | `passenger_03_find_bus_search.png` | Tab: `FIND_BUS` | `src/screens/passenger/RouteSearchScreen.tsx` |
| 9 | `PassengerApp.tsx` (Search Results) | `passenger_04_find_bus_results.png` | Click "Search Buses" | `src/screens/passenger/TripResultsScreen.tsx` |
| 10 | `PassengerApp.tsx` (Seat Grid) | `passenger_05_seat_selection_modal.png` | Click "Select Seats" | `src/screens/passenger/SeatSelectionModal.tsx` |
| 11 | `PassengerApp.tsx` (My Tickets) | `passenger_06_my_tickets.png` | Tab: `TICKETS` | `src/screens/passenger/TicketWalletScreen.tsx` |
| 12 | `PassengerApp.tsx` (QR Modal) | `passenger_07_ticket_qr_modal.png` | Click "View QR" on ticket card | `src/screens/passenger/QrTicketModal.tsx` |
| 13 | `PassengerApp.tsx` (Profile) | `passenger_08_profile_menu.png` | Tab: `PROFILE` | `src/screens/passenger/PassengerProfileScreen.tsx` |
| 14 | `PassengerApp.tsx` (SOS Modal) | `passenger_09_profile_sos_modal.png` | Profile ➔ Tap "SOS (112)" | `src/screens/passenger/SosEmergencyModal.tsx` |
| 15 | `PassengerApp.tsx` (Nearby Stops) | `passenger_10_profile_nearby_stops_modal.png` | Profile ➔ Tap "Bus stops near me" | `src/screens/passenger/NearbyStopsModal.tsx` |
| 16 | `PassengerApp.tsx` (Mobile Drawer) | `passenger_11_mobile_drawer_open.png` | Mobile ➔ Tap `[☰]` toggle | `src/components/layout/MobileDrawer.tsx` |
| **DRIVER MODULE** | | | | |
| 17 | `DriverApp.tsx` (Home) | `driver_01_home.png` | Tab: `HOME` | `src/screens/driver/DriverHomeScreen.tsx` |
| 18 | `DriverApp.tsx` (Select Bus) | `driver_02_select_bus_modal.png` | Click "Select Bus & Start Duty" | `src/screens/driver/SelectBusModal.tsx` |
| 19 | `DriverApp.tsx` (Map Radar) | `driver_03_map_radar.png` | Tab: `MAP` | `src/screens/driver/DriverMapScreen.tsx` |
| 20 | `DriverApp.tsx` (Stops Checklist) | `driver_04_stops_checklist.png` | Tab: `STOPS` | `src/screens/driver/StopsChecklistScreen.tsx` |
| 21 | `DriverApp.tsx` (Trip History) | `driver_05_history.png` | Tab: `HISTORY` | `src/screens/driver/DriverHistoryScreen.tsx` |
| 22 | `DriverApp.tsx` (Profile) | `driver_06_profile.png` | Tab: `PROFILE` | `src/screens/driver/DriverProfileScreen.tsx` |
| **CONDUCTOR MODULE** | | | | |
| 23 | `ConductorApp.tsx` (Home) | `conductor_01_home.png` | Tab: `HOME` | `src/screens/conductor/ConductorHomeScreen.tsx` |
| 24 | `ConductorApp.tsx` (Scan QR) | `conductor_02_scan_qr.png` | Tab: `SCAN` | `src/screens/conductor/QrScannerScreen.tsx` |
| 25 | `ConductorApp.tsx` (Manifest) | `conductor_03_passenger_manifest.png` | Tab: `PASSENGERS` | `src/screens/conductor/PassengerManifestScreen.tsx` |
| 26 | `ConductorApp.tsx` (Cash POS) | `conductor_04_cash_tickets.png` | Tab: `CASH_TICKETS` | `src/screens/conductor/CashTicketingScreen.tsx` |
| 27 | `ConductorApp.tsx` (Profile) | `conductor_05_profile.png` | Tab: `PROFILE` | `src/screens/conductor/ConductorProfileScreen.tsx` |
| **FLEET OWNER MODULE** | | | | |
| 28 | `OwnerDashboard.tsx` (Home) | `owner_01_home.png` | Tab: `HOME` | `src/screens/owner/OwnerHomeScreen.tsx` |
| 29 | `OwnerDashboard.tsx` (Buses) | `owner_02_buses.png` | Tab: `BUSES` | `src/screens/owner/FleetBusesScreen.tsx` |
| 30 | `OwnerDashboard.tsx` (Add Bus) | `owner_03_add_bus_modal.png` | Click "Add Bus" | `src/screens/owner/AddBusModal.tsx` |
| 31 | `OwnerDashboard.tsx` (Live Map) | `owner_04_live_map.png` | Tab: `LIVE_MAP` | `src/screens/owner/LiveFleetRadarScreen.tsx` |
| 32 | `OwnerDashboard.tsx` (Staff) | `owner_05_staff.png` | Tab: `STAFF` | `src/screens/owner/StaffRosterScreen.tsx` |
| 33 | `OwnerDashboard.tsx` (Routes) | `owner_06_routes.png` | Tab: `ROUTES` | `src/screens/owner/RoutesManagerScreen.tsx` |
| 34 | `OwnerDashboard.tsx` (Trips) | `owner_07_trips.png` | Tab: `TRIPS` | `src/screens/owner/TripsDispatchScreen.tsx` |
| 35 | `OwnerDashboard.tsx` (Revenue) | `owner_08_revenue.png` | Tab: `REVENUE` | `src/screens/owner/RevenueAnalyticsScreen.tsx` |
| 36 | `OwnerDashboard.tsx` (Profile) | `owner_09_profile.png` | Tab: `PROFILE` | `src/screens/owner/OwnerProfileScreen.tsx` |
| **SUPER ADMIN MODULE** | | | | |
| 37 | `SuperAdminDashboard.tsx` (Home) | `superadmin_01_home.png` | Tab: `HOME` (ZERO MAP) | `src/screens/superadmin/SuperAdminHomeScreen.tsx` |
| 38 | `SuperAdminDashboard.tsx` (Owners) | `superadmin_02_owners.png` | Tab: `OWNERS` | `src/screens/superadmin/TenantsDirectoryScreen.tsx` |
| 39 | `SuperAdminDashboard.tsx` (Register) | `superadmin_03_register_owner_modal.png` | Click "Register Operator" | `src/screens/superadmin/RegisterOperatorModal.tsx` |
| 40 | `SuperAdminDashboard.tsx` (Buses) | `superadmin_04_buses.png` | Tab: `BUSES` | `src/screens/superadmin/MasterBusesScreen.tsx` |
| 41 | `SuperAdminDashboard.tsx` (Staff) | `superadmin_05_staff.png` | Tab: `STAFF` | `src/screens/superadmin/MasterStaffScreen.tsx` |
| 42 | `SuperAdminDashboard.tsx` (Routes) | `superadmin_06_routes.png` | Tab: `ROUTES` | `src/screens/superadmin/MasterRoutesScreen.tsx` |
| 43 | `SuperAdminDashboard.tsx` (Trips) | `superadmin_07_trips.png` | Tab: `TRIPS` | `src/screens/superadmin/MasterTripsScreen.tsx` |
| 44 | `SuperAdminDashboard.tsx` (Requests) | `superadmin_08_requests.png` | Tab: `REQUESTS` | `src/screens/superadmin/PermitRequestsScreen.tsx` |
| 45 | `SuperAdminDashboard.tsx` (Profile) | `superadmin_09_profile.png` | Tab: `PROFILE` | `src/screens/superadmin/SuperAdminProfileScreen.tsx` |

---

## 5. UI Design System & Approved Styling Reference

### 5.1 Universal TopHeader
Every portal shares the standard TopHeader layout:
* Left Section: Mobile drawer toggle `[☰]` (visible on mobile only), role icon box (`👤`, `🚌`, `🎫`, `🏢`, `🛡️`).
* Brand Wordmark: `RURAL` (`#0f172a` Light / `#ffffff` Dark) + `BUS` (`#00D488`).
* Role Badge: Pill badge displaying `PASSENGER`, `DRIVER`, `CONDUCTOR`, `FLEET OWNER`, or `SUPER ADMIN`.
* Active View Pill: Breadcrumb pill `› {activeViewTitle}`.
* Subtitle: Contextual portal descriptor.
* Right Section: Quick Theme Toggle (`☀️ / 🌙`) and language/profile controls.

### 5.2 Color Tokens & Light Theme Standard (Approved Golden Reference)
* **Page Background**: `#f8fafc` (slate-50).
* **Card Background**: `#ffffff` (pure white).
* **Card Borders**: 1.5px solid `#cbd5e1` / `#e2e8f0` with `borderRadius: 16px to 24px`.
* **Primary Text**: `#0f172a` (slate-900).
* **Secondary Text**: `#475569` (slate-600) / `#64748b` (slate-500).
* **Brand Primary Accent**: `#00D488` (vibrant emerald).
* **Brand Contrast Accent**: `#047857` (emerald-700 for high-contrast text on light backgrounds).
* **Soft Mint Containers**: `#ecfdf5` background with `#a7f3d0` border.
* **Input Fields**: `#ffffff` background with 1.5px solid `#cbd5e1`, placeholder `#94a3b8`, active focus border `#00D488 / #047857`.

---

## 6. Web vs Mobile Layout & Platform Differences

| UI Element | Desktop / Web (>= 900px) | Mobile / Native (< 900px) |
| :--- | :--- | :--- |
| **Header** | Full persistent header with active view pill and subtitle | Compact header, hamburger drawer toggle `[☰]`, role badge |
| **Navigation** | Horizontal navigation pills or desktop sidebar | Bottom tab bar (`SafeAreaView`) + sliding drawer menu |
| **Cards & Grids** | Multi-column grid (3-4 columns for KPI cards) | Single-column stacked cards with full width |
| **Tables** | Full-width data tables with sorting and pagination | Swipeable card list with condensed key/value rows |
| **Touch Targets** | Standard mouse cursor targets (padding 8-12px) | Touch-optimized tap targets (minimum 44x44 points) |
| **Maps** | Interactive Leaflet web maps | Pending evaluation & approval (no replacement chosen yet) |
| **Camera Scanner** | HTML5 Video element / `@zxing/library` | Pending evaluation & approval (no replacement chosen yet) |

---

## 7. Migration Sequence & Order of Phases

The frontend migration will proceed strictly modularly in sequential phases:

```
[Phase 1: Foundation & Primitives]
  ➔ Design tokens, TopHeader, Bottom Tabs, Button, Card, Badge, TextInput, ModalContainer
          ↓
[Phase 2: Authentication & Security Module]
  ➔ LoginScreen, RegisterScreen, OtpModal, ForgotPasswordModal, ForceChangePasswordModal
          ↓
[Phase 3: Passenger Portal]
  ➔ HomeScreen, RouteSearchScreen, SeatGridScreen, CheckoutScreen, TicketWalletScreen, ProfileScreen & Utilities
          ↓
[Phase 4: Driver Portal]
  ➔ DutyHomeScreen, BusSelectionModal, LiveTelemetryMap, StopsChecklistScreen, HistoryScreen, ProfileScreen
          ↓
[Phase 5: Conductor Portal]
  ➔ ConductorHomeScreen, ManifestSync, CameraQrScanner, PassengerManifestScreen, CashTicketPosScreen, ProfileScreen
          ↓
[Phase 6: Operator Admin Dashboard]
  ➔ OwnerHomeScreen, FleetBusesScreen, LiveFleetRadarMap, StaffScreen, RoutesScreen, TripsScreen, RevenueScreen
          ↓
[Phase 7: Super Admin Dashboard]
  ➔ SuperAdminHomeScreen, TenantsScreen, MasterBusesScreen, MasterStaffScreen, MasterRoutesScreen, ComplianceScreen (ZERO MAP)
```

---

## 8. Screenshot & Visual Reference Directory Structure

```
RURAL BUS RN/references/screenshots/
├── capacitor/                         <-- GOLDEN SOURCE OF TRUTH (Actual Capacitor App Captures)
│   ├── desktop/                       <-- 45 Desktop Screenshots (1440x900)
│   │   ├── auth_01_login_light.png ... auth_05_forgot_password_modal.png
│   │   ├── passenger_01_home_light.png ... passenger_11_mobile_drawer_open.png
│   │   ├── driver_01_home.png ... driver_06_profile.png
│   │   ├── conductor_01_home.png ... conductor_05_profile.png
│   │   ├── owner_01_home.png ... owner_09_profile.png
│   │   └── superadmin_01_home.png ... superadmin_09_profile.png
│   └── mobile/                        <-- 45 Mobile Screenshots (390x844)
│       └── [Identical 45 files rendered in mobile viewport]
└── rn_reference/                      <-- REFERENCE / TARGET ONLY (NOT Golden Baseline)
    ├── rn-target-desktop-baseline.png
    └── rn-target-passenger-home-mobile.png
```

---

## 9. Blockers, Unknowns & Approval Gate

### 9.1 Technical Dependencies
- Backend server must be running at `http://localhost:4000` during development.
- Docker background services (`ruralbus-postgres` on 5432, `ruralbus-redis` on 6379) remain active.

### 9.2 Approval Gate
**MIGRATION IMPLEMENTATION IS STRICTLY ON HOLD.**
As instructed:
- Zero UI screens have been migrated yet.
- Full screenshot inventory (45 Desktop + 45 Mobile = 90 total) is completely captured and verified.
- We await your explicit review and approval of the screenshot inventory and migration plan before commencing any screen migration.
