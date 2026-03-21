import db from './db.js';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL CHECK(role IN ('admin','viewer')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS token_blocklist (
      jti        TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp   INTEGER NOT NULL DEFAULT (unixepoch()),
      actor       TEXT NOT NULL,
      action      TEXT NOT NULL,
      target_id   TEXT,
      target_name TEXT,
      outcome     TEXT NOT NULL CHECK(outcome IN ('success','failure')),
      detail      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_logs(actor);
    CREATE INDEX IF NOT EXISTS idx_audit_action    ON audit_logs(action);

    CREATE TABLE IF NOT EXISTS nodes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      hostname    TEXT NOT NULL,
      ip_address  TEXT NOT NULL,
      port        INTEGER NOT NULL DEFAULT 2376,
      tls_cert    TEXT,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS registries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      url         TEXT NOT NULL,
      username    TEXT NOT NULL,
      password    TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS alert_config (
      id               INTEGER PRIMARY KEY CHECK(id = 1),
      smtp_host        TEXT,
      smtp_port        INTEGER,
      smtp_user        TEXT,
      smtp_pass        TEXT,
      email_recipients TEXT,
      webhook_url      TEXT,
      cpu_threshold    INTEGER NOT NULL DEFAULT 90
    );
  `);
}
