import express from 'express';
import { register, login, authMiddleware } from './auth.js';
import { add, subtract, multiply, divide } from '../src/calculator.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Auth routes (public) ────────────────────────────────────────
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// ── Protected calculator API ────────────────────────────────────
app.get('/api/calculator', authMiddleware, (req, res) => {
  res.json({
    user: req.user.username,
    operations: ['add', 'subtract', 'multiply', 'divide'],
  });
});

app.post('/api/calculator/:op', authMiddleware, (req, res) => {
  const { op } = req.params;
  const { a, b } = req.body;

  if (a === undefined || b === undefined) {
    return res.status(400).json({ error: 'both "a" and "b" are required' });
  }

  const numA = Number(a);
  const numB = Number(b);

  if (isNaN(numA) || isNaN(numB)) {
    return res.status(400).json({ error: '"a" and "b" must be numbers' });
  }

  const ops = { add, subtract, multiply, divide };

  if (!ops[op]) {
    return res.status(400).json({ error: `unknown operation: ${op}` });
  }

  try {
    const result = ops[op](numA, numB);
    res.json({ operation: op, a: numA, b: numB, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── Start server ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
