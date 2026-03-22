# GATE0: Product Requirements Document (PRD)

## Overview
GATE0 is a premium access management system for secure communities. It ensures that every visitor entry is authorized by a resident and verified by security personnel.

## User Roles & Requirements

### 1. Resident
- Must be able to generate one-time digital passes for visitors or services (Zomato, Swiggy, etc.).
- Must see real-time updates when their visitor is scanned or approved.
- Dashboard should show active and past passes.

### 2. Security Guard
- Must be able to scan QR codes provided by visitors.
- Must be able to manually enter pass codes if scanning fails.
- Must be able to Approve or Deny/Flag entries.
- Must have access to security logs with search and filter functionality.
- Must be able to export logs to CSV for audits.

### 3. Visitor
- Must be able to present a digital QR token to the guard.
- Must see their authorization status (Active, Approved, or Denied).

## Technical Requirements
- **Local-First**: The system must run on a local network without mandatory cloud dependence.
- **High Performance**: Dashboard polling (5s) for instant state updates.
- **Security**: JWT-based session management and signed QR tokens.
- **Device Support**: Fully responsive on iOS and Android via Expo Go.
