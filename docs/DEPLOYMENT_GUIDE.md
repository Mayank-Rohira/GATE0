# GATE0 Deployment Guide

This guide will help you deploy the GATE0 project to the cloud using **Render** for the backend, **Supabase** for the database, and **Vercel** for the frontend.

## 🛢️ 1. Database Setup (Supabase)

GATE0 uses **Supabase (PostgreSQL)** for high-availability cloud persistence.

1.  **Create a Supabase Project**: Go to [supabase.com](https://supabase.com).
2.  **Get Connection String**: 
    - Go to **Project Settings** > **Database**.
    - Copy the **Connection String** (Transaction mode recommended for serverless/pooled connections).
    - Ensure your password is URL-encoded if it contains special characters.

---

## 🚀 2. Deploy the Backend (Render)

Render is great for Node.js/Express apps.

### Steps:
1.  **Create a Render Account**: Go to [render.com](https://render.com).
2.  **New Web Service**: Click **New +** and select **Web Service**.
3.  **Connect GitHub**: Connect your repository.
4.  **Configure**:
    - **Name**: `gate0-backend`
    - **Root Directory**: `backend`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - Add `DATABASE_URL`: Your Supabase connection string.
    - Add `JWT_SECRET`: (Any secure random string).
    - Add `PORT`: `3000`
6.  **Deploy**: Once finished, you will get a URL like `https://gate0-backend.onrender.com`.

---

## 🎨 3. Deploy the Frontend (Vercel)

Vercel is ideal for the React Native/Expo web version.

### Steps:
1.  **Create a Vercel Account**: Go to [vercel.com](https://vercel.com).
2.  **New Project**: Click **Add New** and select **Project**.
3.  **Connect GitHub**: Select your repository.
4.  **Configure**:
    - **Framework Preset**: Other (Vercel detects Expo web settings usually).
    - **Root Directory**: `frontend`
    - **Build Command**: `npx expo export --platform web`
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    - Add **Key**: `EXPO_PUBLIC_API_URL`
    - Add **Value**: `https://gate0-backend.onrender.com`
6.  **Deploy**: Click Deploy.

---

## 📱 4. Connecting the Mobile App (Expo Go)

To use the Cloud backend on your physical device via `expo start`:

1.  **Configure Environment**:
    - Create a file `.env.local` inside the `frontend/` folder.
    - Add: `EXPO_PUBLIC_API_URL=https://gate0-backend.onrender.com`
2.  **Launch**:
    - Run `npx expo start --clear`
    - Scan the QR in the **Expo Go** app. It will now communicate with the Cloud backend.
