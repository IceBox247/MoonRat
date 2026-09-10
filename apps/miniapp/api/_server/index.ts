// Local / long-running server entry (used for `npm run dev` and non-serverless hosts).
// On Vercel serverless the app is imported directly by api/index.ts instead.
import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`🐀  Moonrat API listening on http://localhost:${config.port}`);
  console.log(`    balance provider: ${config.ton.provider}  |  dev-auth: ${config.allowDevAuth}`);
});
