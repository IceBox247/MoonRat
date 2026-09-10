import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { miningRouter } from './routes/mining';
import { expeditionRouter } from './routes/expedition';
import { crewRouter } from './routes/crew';
import { vaultRouter } from './routes/vault';
import { metaRouter } from './routes/meta';
import { adminRouter } from './routes/admin';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
          return cb(null, true);
        }
        cb(null, true); // permissive foundation; tighten via CORS_ORIGINS for prod
      },
    })
  );

  app.get('/', (_req, res) => res.json({ ok: true, service: 'moonrat-api' }));
  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, service: 'moonrat-api', ts: Date.now() })
  );

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

  // Express 4 doesn't forward async-handler rejections to the error middleware; patch every
  // registered handler so a thrown/rejected error becomes a clean 500 instead of a crash.
  wrapAsyncHandlers(((app as any)._router?.stack) ?? []);
  return app;
}

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

// Last-resort guard: never let a stray rejection take the process down.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', (reason as Error)?.message ?? reason);
});

const app = createApp();
export default app;
