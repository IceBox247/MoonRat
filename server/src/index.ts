import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/user.js';
import { miningRouter } from './routes/mining.js';
import { expeditionRouter } from './routes/expedition.js';
import { crewRouter } from './routes/crew.js';
import { vaultRouter } from './routes/vault.js';
import { metaRouter } from './routes/meta.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(
  cors({
    origin(origin, cb) {
      // Allow no-origin (curl, native TG webview) + configured dev origins.
      if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
        return cb(null, true);
      }
      cb(null, true); // permissive in foundation; tighten for prod
    },
  })
);

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'moonrat-api', ts: Date.now() }));

app.use('/api/auth', authRouter);
app.use('/api', userRouter); // /me, /wallet/*
app.use('/api/mining', miningRouter);
app.use('/api/expedition', expeditionRouter);
app.use('/api/crew', crewRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/meta', metaRouter);
app.use('/api/admin', adminRouter);

// Central error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err?.message ?? err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error' });
});

/**
 * Express 4 does NOT forward rejected promises from async route handlers to the error
 * middleware — an unhandled rejection would otherwise crash the whole server (downtime).
 * Patch every registered handler so a thrown/rejected error goes to the error handler
 * as a clean 500 instead. Recurses into mounted sub-routers (e.g. admin CRUD).
 */
function wrapAsyncHandlers(stack: any[]) {
  for (const layer of stack) {
    if (layer?.route?.stack) {
      for (const s of layer.route.stack) {
        const orig = s.handle;
        if (typeof orig === 'function' && orig.length < 4 && !orig.__wrapped) {
          const wrapped = function (this: unknown, req: any, res: any, next: any) {
            Promise.resolve(orig.call(this, req, res, next)).catch(next);
          };
          (wrapped as any).__wrapped = true;
          s.handle = wrapped;
        }
      }
    } else if (layer?.handle && Array.isArray(layer.handle.stack)) {
      wrapAsyncHandlers(layer.handle.stack);
    }
  }
}
wrapAsyncHandlers(((app as any)._router?.stack) ?? []);

// Last-resort guard: never let a stray rejection take the process down.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', (reason as Error)?.message ?? reason);
});

app.listen(config.port, () => {
  console.log(`🐀  Moonrat API listening on http://localhost:${config.port}`);
  console.log(`    balance provider: ${config.ton.provider}  |  dev-auth: ${config.allowDevAuth}`);
});
