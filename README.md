# GATE0
> A high-performance, RBAC-driven security management system for gated communities, featuring instant QR validation and real-time cloud audit logging.

![React Native](https://img.shields.io/badge/Frontend-React%20Native%20(Expo)-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20(Express)-green)
![Database](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-orange)
![Auth](https://img.shields.io/badge/Security-JWT%20%2B%20Bcrypt-red)

---

## What made this challenging

- **Cross-Platform Tactical UI** — Developing a "Deep Space Terminal" aesthetic that remains responsive across web, iOS, and Android required a unified design system. I utilized **NativeWind (Tailwind)** and **Reanimated** to ensure interaction-driven spring animations felt weighted and premium on all devices.
- **Cloud Data Integrity** — Migrating from local storage to **Supabase (PostgreSQL)** required refactoring the persistence layer to handle asynchronous database operations while maintaining strict data integrity. I ensured that pass activations and audit logs are synchronized across multiple terminal instances in real-time.
- **Atomic Security Auditing** — Designing the pass approval workflow required strict data integrity. I engineered a controller logic that atomically updates pass status and generates a secure audit log, preventing "orphaned" entries and ensuring a reliable "Single Source of Truth."

---

## How it works

The system follows a stateless architecture where JWTs carry role-specific claims to minimize database lookups. 

```
Resident (Issue) → API (JWT Verify) → Supabase (Pending) → Frontend (XOR-Obfuscated QR)
                                                                         ↓
Guard (Scan QR) ← Scan Logic (Decrypt) ← API (RBAC: Guard) ← Pass Controller (Verify)
                                     ↓
Audit Log (Created) ← Atomic DB Transaction (Pass: Approved)
```

**Key Feature: Rich QR Schema**
Instead of simple IDs, the system generates a rich payload that is XOR-obfuscated on the client side. This prevents generic scanners from reading visitor data while allowing the Guard Unit to receive structured context (Visitor Name, Service Type, Resident House #) instantly upon scanning.

---

## Tech stack

| **Frontend** | React Native / Expo | Cross-platform (Web/iOS/Android) with **Reanimated** kinetic interactions. |
| **Styling** | NativeWind | Utility-first logic bridging web and native styling hierarchies. |
| **Backend** | Node.js / Express | Robust async I/O with **node-postgres** for cloud synchronization. |
| **Database** | Supabase (PostgreSQL) | High-availability cloud-first engine with optimized relational indexing. |
| **Security** | XOR + JWT | Client-side obfuscation for QR payloads + stateless role-based auth. |

---

## Getting started

**Prerequisites:** Node.js 20+, NPM, Expo Go (for mobile testing), Supabase Account

### 1. Backend Setup
```bash
cd backend
npm install
# Create .env with: PORT=3000, JWT_SECRET=your_secret, DATABASE_URL=your_supabase_url
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Create .env.local with: EXPO_PUBLIC_API_URL=http://localhost:3000
npx expo start
```

---

## Next Steps

- **Socket.io Integration** — Implement a Pub/Sub mechanism to push instant "Entry Approved" notifications to the Resident's device the moment a guard scans the pass, replacing the current polling mechanism.
- **Signed QR Payloads** — I would implement HMAC signing for the QR payloads. This would allow guard devices to verify the authenticity of a pass even if the central server is temporarily unreachable (Offline Validation).
- **Biometric Guard Auth** — Integrate FaceID/Fingerprint validation for the Guard Persona to ensure the terminal remains locked to authorized personnel only.
- **Multi-Society Tenancy** — Extend the schema to support multiple communities within a single backend instance using RLS (Row Level Security).

---

## What I learned

This project taught me that "simple" databases can be remarkably robust when properly architected for cloud synchronization. It also reinforced the importance of building a shared design system early—using tokens for the "Obsidian Standard" allowed me to pivot UI colors and spacing across the entire cross-platform fleet in minutes.
