# 🏢 GATE0 Backend End-to-End Test Report

**Date:** 2026-03-10T17:11:55.755Z

## Phase 1: Authentication Endpoints

### 1. POST `/signup`

- **Resident Signup:** [201] Pass ✅ (Expected 201)
- **Visitor Signup:** [201] Pass ✅ (Expected 201)
- **Guard Signup:** [201] Pass ✅ (Expected 201)

### 2. POST `/login`

- **Resident Login:** [200] Pass ✅
- **Visitor Login:** [200] Pass ✅
- **Guard Login:** [200] Pass ✅

## Phase 2: Pass Management Endpoints

### 3. POST `/passes/create`

- **Create Pass:** [201] Pass ✅ -> Generated Code: `PASS_711307`

### 4. GET `/passes/resident/:id`

- **Fetch Resident Passes:** [200] Pass ✅

### 5. GET `/passes/visitor/:mobile`

- **Fetch Visitor Passes:** [200] Pass ✅ (Returns extra join info: Yes ✅)

## Phase 3: Guard Verification and Logs

### 6. POST `/passes/validate`

- **Validate Pass:** [200] Pass ✅

### 7. POST `/passes/approve`

- **Approve Pass:** [200] Pass ✅

### 8. GET `/logs/:guard_id`

- **Fetch Guard Logs:** [200] Pass ✅ (Includes formatted time: Yes ✅)