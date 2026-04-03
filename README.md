# GATE0
> A high-performance, RBAC-driven security management system for gated communities, featuring instant QR validation and real-time audit logging.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![Database](https://img.shields.io/badge/SQLite-Better--SQLite3-orange)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-red)

---

## What made this challenging

- **Concurrency in Local Storage** — To handle simultaneous requests from residents (pass issuance) and guards (validation) in a high-traffic environment, I implemented SQLite's **Write-Ahead Logging (WAL)** mode. This transformed the standard single-writer limitation into a performant engine capable of concurrent reads and writes.
- **Atomic Security Auditing** — Designing the pass approval workflow required strict data integrity. I engineered a controller logic that atomically updates pass status and generates a secure audit log. This prevents "orphaned" entries where a visitor is admitted without a corresponding guard record.
- **Role-Based Access Control (RBAC)** — Orchestrating three distinct user personas (Resident, Visitor, Guard) through a unified authentication middleware. Each role has granular permissions, ensuring Residents cannot validate their own passes and Guards cannot issue unauthorized entries.

---

## How it works

The system follows a stateless architecture where JWTs carry role-specific claims to minimize database lookups for authorization.

```
Resident (Issue) → JWT Verify → Pass Controller (Collision Check) → SQLite (Pending)
                                                                       ↓
Guard (Scan QR) ← Middleware (RBAC: Guard) ← Pass Controller (Verify) ← Pass Link
                                    ↓
Audit Log (Created) ← DB Transaction (Pass: Approved)
```

**Key Feature: Rich QR Schema**
Instead of simple IDs, the system generates a rich JSON payload for QR codes. This allows the guard station to receive structured data (Visitor Name, Service Type, Resident House #) instantly upon scanning, reducing UI latency.

---

## Tech stack

| Layer | Technology | Why I chose it |
|---|---|---|
| Backend | Node.js / Express | Fast development cycle and excellent support for asynchronous I/O. |
| Database | better-sqlite3 | Native performance and support for WAL mode, ideal for high-concurrency local-first apps. |
| Auth | JWT / Bcrypt | Stateless authentication for scalability and industry-standard password hashing (10 salt rounds). |

---

## Getting started

**Prerequisites:** Node.js 18+, NPM

```bash
# 1. Clone the repo
git clone https://github.com/Mayank-Rohira/GATE0
cd GATE0

# 2. Install dependencies (Backend)
cd backend
npm install

# 3. Set up environment variables
# Create a .env file with:
# PORT=3000
# JWT_SECRET=your_super_secret_key
# DB_PATH=./gate0.db

# 4. Run the app
npm start
```

---

## If I had more time

- **Signed QR Payloads** — I would implement HMAC signing for the QR payloads. This would allow guard devices to verify the authenticity of a pass even if the central server is temporarily unreachable (Offline Validation).
- **Real-time Notifications** — Implement a Pub/Sub mechanism (Socket.io) to push instant "Entry Approved" notifications to the Resident's device the moment a guard scans the pass.
- **Tradeoffs:** Chose SQLite for its zero-config simplicity and speed in local environments. For a multi-region production rollout, I would migrate to PostgreSQL to handle distributed locking and larger data volumes.

---

## What I learned

This project taught me that "simple" databases like SQLite can be remarkably robust when configured with modern pragmas like `WAL` and `foreign_keys = ON`. It also reinforced the importance of designing security into the middleware layer rather than the controllers, keeping the business logic clean and auditable.
