import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import db from '../db/db.js';
import docker from './docker_client.js';

const ALGO = 'aes-256-gcm';
const ENC_KEY = Buffer.from(
  (process.env.REGISTRY_ENC_KEY || '').padEnd(64, '0').slice(0, 64),
  'hex'
);

function encrypt(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(stored) {
  const [ivHex, tagHex, encHex] = stored.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGO, ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export function listRegistries() {
  const rows = db.prepare('SELECT id, name, url, username, created_at FROM registries').all();
  return rows;
}

export function createRegistry({ name, url, username, password }) {
  const encPass = encrypt(password);
  const result = db
    .prepare('INSERT INTO registries (name, url, username, password) VALUES (?, ?, ?, ?)')
    .run(name, url, username, encPass);
  return { id: result.lastInsertRowid, name, url, username };
}

export function deleteRegistry(id) {
  db.prepare('DELETE FROM registries WHERE id = ?').run(id);
}

export function getRegistryById(id) {
  return db.prepare('SELECT * FROM registries WHERE id = ?').get(id);
}

export async function testConnection(id) {
  const reg = getRegistryById(id);
  if (!reg) throw Object.assign(new Error('Registry not found'), { status: 404 });

  const password = decrypt(reg.password);
  const base = reg.url.replace(/\/$/, '');

  const res = await fetch(`${base}/v2/`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${reg.username}:${password}`).toString('base64')}`,
    },
  });

  return { ok: res.ok, status: res.status };
}

export async function listImages(id) {
  const reg = getRegistryById(id);
  if (!reg) throw Object.assign(new Error('Registry not found'), { status: 404 });

  const password = decrypt(reg.password);
  const base = reg.url.replace(/\/$/, '');

  const res = await fetch(`${base}/v2/_catalog`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${reg.username}:${password}`).toString('base64')}`,
    },
  });

  if (!res.ok) throw Object.assign(new Error('Failed to list images'), { status: res.status });
  const data = await res.json();
  return data.repositories || [];
}

export async function pullFromRegistry(imageRef, registryId) {
  const reg = getRegistryById(registryId);
  if (!reg) throw Object.assign(new Error('Registry not found'), { status: 404 });

  const password = decrypt(reg.password);
  await docker.pull(imageRef, {
    authconfig: { username: reg.username, password, serveraddress: reg.url },
  });
}
