import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../api/server.js';

// Helper: build full URL for the local test server
function url(path) {
  return `http://127.0.0.1:${PORT}${path}`;
}

let server;
let PORT;

// Start the server on a random port before tests run
test.before(async () => {
  // Use a random port to avoid conflicts
  PORT = 30000 + Math.floor(Math.random() * 10000);
  await new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
});

// Stop the server after all tests
test.after(() => {
  if (server) server.close();
});

// ── Auth: Register ──────────────────────────────────────

test('POST /api/auth/register — success', async () => {
  const res = await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'password123' }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.deepEqual(body, { success: true });
});

test('POST /api/auth/register — duplicate username', async () => {
  const res = await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'password123' }),
  });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.error, 'username already exists');
});

test('POST /api/auth/register — missing username', async () => {
  const res = await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'password123' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'username and password are required');
});

test('POST /api/auth/register — short username', async () => {
  const res = await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ab', password: 'password123' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'username must be at least 3 characters');
});

test('POST /api/auth/register — short password', async () => {
  const res = await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'newuser', password: '12345' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'password must be at least 6 characters');
});

// ── Auth: Login ─────────────────────────────────────────

let validToken;

test('POST /api/auth/login — success', async () => {
  // First register a user
  await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'loginuser', password: 'mypassword' }),
  });

  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'loginuser', password: 'mypassword' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.token);
  assert.ok(typeof body.token === 'string');
  validToken = body.token;
});

test('POST /api/auth/login — wrong password', async () => {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'loginuser', password: 'wrongpassword' }),
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'invalid credentials');
});

test('POST /api/auth/login — non-existent user', async () => {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nobody', password: 'password123' }),
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'invalid credentials');
});

test('POST /api/auth/login — missing fields', async () => {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'username and password are required');
});

// ── Protected Routes ────────────────────────────────────

test('GET /api/calculator — 401 without token', async () => {
  const res = await fetch(url('/api/calculator'));
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.ok(body.error);
});

test('GET /api/calculator — 401 with malformed header', async () => {
  const res = await fetch(url('/api/calculator'), {
    headers: { 'Authorization': 'NotBearer xxx' },
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'missing or invalid authorization header');
});

test('GET /api/calculator — 401 with invalid token', async () => {
  const res = await fetch(url('/api/calculator'), {
    headers: { 'Authorization': 'Bearer invalidtoken' },
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, 'invalid token');
});

test('GET /api/calculator — success with valid token', async () => {
  const res = await fetch(url('/api/calculator'), {
    headers: { 'Authorization': `Bearer ${validToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user, 'loginuser');
  assert.ok(Array.isArray(body.operations));
});

test('POST /api/calculator/add — 401 without token', async () => {
  const res = await fetch(url('/api/calculator/add'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ a: 2, b: 3 }),
  });
  assert.equal(res.status, 401);
});

test('POST /api/calculator/add — success with valid token', async () => {
  const res = await fetch(url('/api/calculator/add'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ a: 2, b: 3 }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.result, 5);
});

test('POST /api/calculator/divide — division by zero', async () => {
  const res = await fetch(url('/api/calculator/divide'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ a: 10, b: 0 }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
});

test('POST /api/calculator/unknown — unknown operation', async () => {
  const res = await fetch(url('/api/calculator/factorial'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${validToken}`,
    },
    body: JSON.stringify({ a: 5, b: 0 }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error, 'unknown operation: factorial');
});

// ── Token Expiry ────────────────────────────────────────

test('JWT token — has 24h expiry', async () => {
  // Register + login to get a fresh token
  await fetch(url('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'expiryuser', password: 'password123' }),
  });

  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'expiryuser', password: 'password123' }),
  });
  const body = await res.json();

  // Decode the JWT payload (no verification needed) to check exp
  const parts = body.token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload.exp - now;
  // Should be roughly 24 hours (86400 seconds) — allow 5 second tolerance
  assert.ok(expiresIn > 86395 && expiresIn <= 86400,
    `Expected ~86400s expiry, got ${expiresIn}s`);
});
