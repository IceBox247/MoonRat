// Vercel serverless entry — one project serves the Vite app AND this /api function.
// vercel.json rewrites every /api/* request here; the Express app does its own routing.
import app from './_server/app';

export default app;
