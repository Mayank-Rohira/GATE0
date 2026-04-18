# GATE0: Project Roadmap & Task Board

## Core Infrastructure
- [x] Initial Express/SQLite Backend
- [x] React Native/Expo Frontend (Kinetic Shell)
- [x] Basic JWT Authentication
- [x] Pass Generation & Validation Logic

## Architecture & Security (Current Focus)
- [x] Performance Indexing for SQL Schema
- [X] Atomic Transactions for Pass Approval/Logging
- [x] Sync Documentation with Architecture Claims
- [x] **Migrate to Cloud Database (Supabase)**
    - [x] Setup Supabase PostgreSQL Project
    - [x] Convert `schema.sql` to PostgreSQL syntax
    - [x] Replace `better-sqlite3` with `pg` (PostgreSQL driver)
    - [x] Refactor all Controller logic from Sync to Async/Await
    - [x] Update `.env` with Supabase Connection String (Ensure special characters in password are URL-encoded)
- [ ] Implement Refresh Token Logic for Long-lived Sessions

## 📋 User Actions Required for Supabase Migration
1. **Create Supabase Project**: Sign up at [supabase.com](https://supabase.com) and create a new project named `GATE0`.
2. **Retrieve Connection String**: Go to **Settings > Database** and copy the **Connection String** (use the "Transaction" or "Session" string).
3. **Provide Credentials**: Share the connection string or add it to your `backend/.env` as `DATABASE_URL`.

## Frontend Refinements
- [x] Client-side XOR QR Obfuscation
- [x] Client-side CSV Log Export

## Deployment
- [x] Remove docs from gitignore for tracking