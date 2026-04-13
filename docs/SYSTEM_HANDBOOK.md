# GATE0: System Architecture & Design Handbook

## High-Security Infrastructure
GATE0 is built as a mission-critical, local-first platform for access orchestration. It emphasizes **Backend Reliability**, **Security-First Workflow**, and **Tactile UI** for professional-grade security performance.

---

## 🏗️ Technical Stack
### Backend: Node.js / Express Core
- **Persistence**: High-integrity SQLite with semi-normalized schema for low-latency audit performance. Optimized with Write-Ahead Logging (WAL) for concurrent operations.
- **Security Protocols**: 
  - JWT-driven stateless session management for Residents, Visitors, and Guards.
  - Bcrypt password hashing (10 salt rounds).
  - Secure, metadata-rich QR tokenization for sub-second verification.
- **Logic Layers**: 
  - `Auth Controller`: Secure onboarding and role-based token issuance.
  - `Pass Controller`: Managing pass lifecycle (Generate -> Approve -> Log).
  - `Log Controller`: Unified audit stream for security oversight.

### Frontend: Cross-Platform Kinetic Shell (React Native)
- **Framework**: Expo (React Native) with NativeWind (Tailwind v3.4+) logic.
- **Design System**: "The Obsidian Standard" — a deep-charcoal, tactile UI language using:
  - **Inter & Montserrat Typography**: Professional grotesque and geometric type for absolute clarity.
  - **Tonal Layering**: Depth achieved through etched surface hierarchy and sophisticated color tokens.
  - **Liquid Transitions**: Interaction-driven spring animations (via Reanimated) for a weighted, responsive feel.

---

## 🛡️ Security Logistics
### Dynamic Identity Protocols (DIP)
All visitor passes are issued as security-focused digital tokens containing:
- Visitor ID & Pass Code
- Resident Context (Unit/Unit No)
- Society/Location Metadata
- XOR-Obfuscated QR Payloads (Prevents basic data extraction by generic scanners).

### Real-time Audit Logistics
Every scanning event is captured instantly in the `GATE0_DB`, creating an immutable, searchable activity trail for security supervisors. The frontend provides real-time polling to ensure dashboards are consistently synchronized with the backend.

---

## 🎨 Visual Identity: The Monolith
The UI is treated as a solid block of obsidian, milled with precision functional modules. Boundaries are defined by background shifts and tactile borders, creating a premium "high-trust" experience for facility residents. Using a 13px hierarchy and atomic design system ensures consistent interaction patterns across all personas.
