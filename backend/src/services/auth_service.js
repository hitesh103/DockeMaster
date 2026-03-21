import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dockmaster-dev-secret-change-in-production';
const BCRYPT_ROUNDS = 10;
const TOKEN_EXPIRY = '24h';

// ── JWT ──────────────────────────────────────────────────────────────────────

export function signToken(user) {
  const jti = uuidv4();
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, jti },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY, algorithm: 'HS256' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ── Blocklist ─────────────────────────────────────────────────────────────────

export function blockToken(jti, exp) {
  db.prepare(
    'INSERT OR IGNORE INTO token_blocklist (jti, expires_at) VALUES (?, ?)'
  ).run(jti, exp);
}

export function isBlocked(jti) {
  const row = db.prepare('SELECT 1 FROM token_blocklist WHERE jti = ?').get(jti);
  return !!row;
}

// ── Passwords ─────────────────────────────────────────────────────────────────

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Seed default admin ────────────────────────────────────────────────────────

export async function seedAdminUser() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (count.cnt === 0) {
    const hashed = await hashPassword('admin');
    db.prepare(
      "INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')"
    ).run(hashed);
    console.log('✅ Default admin user created (username: admin, password: admin)');
  }
}
