# GATE0: Secure Community Access System

GATE0 is a premium, secure access management system designed for gated communities. It provides a seamless interface for residents to authorize visitors and for security guards to verify access.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go (on your mobile device)
- SQLite3

### Installation
1. Install dependencies:
   ```bash
   # Root
   npm install

   # Client
   cd app && npm install

   # Server
   cd ../server && npm install
   ```

2. Start the Backend Server:
   ```bash
   cd server
   node server.js
   ```

3. Start the Frontend (Expo):
   ```bash
   cd app
   npx expo start --web
   ```

---

## 👥 User Roles

### 1. Resident Dashboard
Residents can manage access for their household.
- **Pass Creation:** Generate digital passes for services (Zomato, Swiggy, Zepto) or personal guests.
- **Pass Tracking:** View 'Active' (Pending) and 'Approved' passes in real-time.
- **Auto-Update:** Dashboard polls the server every 5 seconds to show latest entry statuses.

### 2. Guard Portal (Security)
Security personnel verify and log visitor entries.
- **QR Scanner:** Instant verification of a visitor's digital pass using the device camera.
- **Manual Verification:** Input pass codes manually if the QR code cannot be scanned.
- **Security Logs:** A comprehensive log of all entries, showing visitor details, authorizing resident, house number, and timestamps.
- **CSV Export:** Download security logs for audits and records.

### 3. Visitor Portal
Visitors use this to present their authorization.
- **Digital Token:** Once a resident creates a pass, the visitor can view their secure QR token.
- **Status Indicator:** Shows whether the pass is active or has already been used.

---

## ✨ Key Features

### Premium Aesthetics
- **Deep Space Theme:** A dark, futuristic UI inspired by command terminals.
- **Typography:** Uses `Abril Fatface` for high-impact headers and `Montserrat` for clarity.
- **Interactions:** Subtle haptic feedback and spring animations for a premium feel.

### Seamless Connectivity
- **Cross-Platform:** Works on Web and Mobile (iOS/Android).
- **Local Network Sync:** Easily update `api.js` with your local IP to test on physical mobile devices.

### Security & Auditing
- **Unique Passcodes:** Every entry is tied to a one-time secure passcode.
- **Detailed Logging:** Captures visitor mobile numbers and specific resident identifiers for every scan.

---

## 🛠 Technical Overview
- **Frontend:** React Native / Expo
- **Backend:** Node.js / Express
- **Database:** SQLite3
- **Animations:** React Native Reanimated
- **Icons:** Lucide React Native
