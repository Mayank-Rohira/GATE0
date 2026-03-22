# GATE0 Deployment Guide

This guide will help you deploy the GATE0 project to the cloud using **Render** for the backend and **Vercel** for the frontend.

## 🚀 1. Deploy the Backend (Render)

Render is great for Node.js apps. Since GATE0 uses SQLite3, please note that files are NOT persistent on Render's free tier. 

### Steps:
1.  **Create a Render Account**: Go to [render.com](https://render.com).
2.  **New Web Service**: Click **New +** and select **Web Service**.
3.  **Connect GitHub**: Connect your repository.
4.  **Configure**:
    - **Name**: `gate0-backend` (or similar).
    - **Root Directory**: `backend`
    - **Environment**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - Add `JWT_SECRET`: (Any secure random string).
    - Add `PORT`: `3000` (Optional, Render detects it automatically).
6.  **Deploy**: Once finished, you will get a URL like `https://gate0-backend.onrender.com`. **Copy this URL.**

---

## 🎨 2. Deploy the Frontend (Vercel)

Vercel is perfect for the React Native/Expo web version.

### Steps:
1.  **Create a Vercel Account**: Go to [vercel.com](https://vercel.com).
2.  **New Project**: Click **Add New** and select **Project**.
3.  **Connect GitHub**: Select your repository.
4.  **Configure**:
    - **Framework Preset**: Other (or select Vite if prompted, but "Other" works).
    - **Root Directory**: `frontend`
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    - Add **Key**: `EXPO_PUBLIC_API_URL`
    - Add **Value**: `https://gate0-backend.onrender.com` (Your Render URL).
6.  **Deploy**: Click Deploy. Once finished, you'll have a live web version of GATE0!

---

## 📱 3. Connecting the Mobile App (Expo Go)

When you want to run the app on your physical device using the Cloud backend:

1.  **Vercel Build**: The Vercel deployment handles the **web version**.
2.  **Mobile Dev**: To use the Cloud backend on your phone via `expo start`:
    - Create a file `.env.local` inside the `frontend/` folder.
    - Add: `EXPO_PUBLIC_API_URL=https://gate0-backend.onrender.com`
    - Restart Expo: `npx expo start --clear`
    - Scan the QR in Expo Go. It will now talk to the cloud instead of your laptop.

---

## ⚠️ Important Note on SQLite
Render's free tier resets the filesystem on every deploy. Your users/passes will be deleted when the server restarts. 
**For Production**: Use a Render **PostgreSQL** database and update `backend/database/db.js` to connect to it instead of SQLite.
