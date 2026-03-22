// For Local: Use your laptop's IP (e.g., 'http://192.168.1.42:3000')
// For Deployment: Set the EXPO_PUBLIC_API_URL environment variable in your CI/CD (e.g., Vercel)
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'; 

