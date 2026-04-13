import 'dotenv/config';
import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 8000);
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

