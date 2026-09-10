// Vercel serverless entry. Vercel maps this to /api; server/vercel.json rewrites every
// request here so the Express app does its own /api/* routing.
import app from '../src/app';

export default app;
