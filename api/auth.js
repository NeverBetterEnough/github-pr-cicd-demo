import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// In-memory user store
const users = new Map();

// JWT secret — in production use an env var
const JWT_SECRET = process.env.JWT_SECRET || 'calculator-jwt-secret-dev-only';
const JWT_EXPIRY = '24h';

/**
 * POST /api/auth/register
 * Body: { username, password }
 * Hashes the password and stores the user.
 */
export async function register(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'username and password must be strings' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  if (users.has(username)) {
    return res.status(409).json({ error: 'username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.set(username, { username, password: hashedPassword });

  return res.status(201).json({ success: true });
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Verifies credentials and returns a signed JWT.
 */
export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = users.get(username);
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign(
    { username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return res.json({ token });
}

/**
 * Express middleware — protects routes by requiring a valid JWT.
 * Expects header: Authorization: Bearer <token>
 * Returns 401 if the token is missing, invalid, or expired.
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token expired' });
    }
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Export users map for testing
export { users };
