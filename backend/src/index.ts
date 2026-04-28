import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import { config } from './config';
import { jsonError } from './http';
import { authRoutes } from './routes/authRoutes';
import { categoriesRoutes } from './routes/categoriesRoutes';
import { transactionsRoutes } from './routes/transactionsRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { nlpRoutes } from './routes/nlpRoutes';
import { initDb } from './initDb';

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/nlp', nlpRoutes);

app.use((_req, res) => {
  return jsonError(res, 404, 'Không tìm thấy endpoint.');
});

const port = config.port;
void (async () => {
  await initDb();
  app.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
})();

