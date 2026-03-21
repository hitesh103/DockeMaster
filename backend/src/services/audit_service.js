import db from '../db/db.js';

/**
 * Write an audit log entry to the database.
 * @param {{ actor: string, action: string, targetId?: string, targetName?: string, outcome: string, detail?: any }} entry
 */
export function write({ actor, action, targetId, targetName, outcome, detail }) {
  const detailStr = detail && typeof detail === 'object'
    ? JSON.stringify(detail)
    : detail ?? null;

  const stmt = db.prepare(`
    INSERT INTO audit_logs (actor, action, target_id, target_name, outcome, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(actor, action, targetId ?? null, targetName ?? null, outcome, detailStr);
}

/**
 * Query audit log entries with optional filters.
 * @param {{ actor?: string, action?: string, from?: number, to?: number, page?: number, pageSize?: number }}
 * @returns {{ entries: object[], total: number, page: number, pageSize: number }}
 */
export function query({ actor, action, from, to, page = 1, pageSize = 50 } = {}) {
  const conditions = [];
  const params = [];

  if (actor) {
    conditions.push('actor = ?');
    params.push(actor);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (from != null) {
    conditions.push('timestamp >= ?');
    params.push(from);
  }
  if (to != null) {
    conditions.push('timestamp <= ?');
    params.push(to);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const total = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${where}`).get(...params).count;
  const entries = db.prepare(`
    SELECT * FROM audit_logs ${where}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return { entries, total, page, pageSize };
}
