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
  res.status(500).json({ error: 'internal_error' });
});

app.listen(config.port, () => {
  console.log(`🐀  Moonrat API listening on http://localhost:${config.port}`);
  console.log(`    balance provider: ${config.ton.provider}  |  dev-auth: ${config.allowDevAuth}`);
});
