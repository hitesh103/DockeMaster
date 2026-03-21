import { write } from '../services/audit_service.js';

/**
 * Derives an action string from the HTTP method and path.
 * e.g. POST /api/containers/abc123/stop → "container.stop"
 */
function deriveAction(method, path) {
  // Strip leading /api/ and any trailing slashes
  const stripped = path.replace(/^\/api\//, '').replace(/\/$/, '');
  const parts = stripped.split('/');

  // Remove ID-like segments (UUIDs, hex strings, numeric IDs)
  const meaningful = parts.filter(p => !/^[0-9a-f]{8,}$/i.test(p) && !/^\d+$/.test(p));

  if (meaningful.length === 0) return method.toLowerCase();

  const resource = meaningful[0].replace(/-/g, '_');

  if (meaningful.length === 1) {
    // e.g. POST /api/containers → container.create
    //      DELETE /api/containers → container.remove (unlikely but handled)
    const methodMap = { POST: 'create', PUT: 'update', DELETE: 'remove', PATCH: 'update' };
    const verb = methodMap[method] || method.toLowerCase();
    // Singularize simple plurals
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    return `${singular}.${verb}`;
  }

  // e.g. ["containers", "stop"] → "container.stop"
  const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;
  const verb = meaningful[meaningful.length - 1];
  return `${singular}.${verb}`;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

/**
 * Express middleware that intercepts mutating responses and writes an audit log entry.
 * Only logs when req.user is set (authenticated requests).
 */
export function auditMiddleware(req, res, next) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only audit authenticated requests
    if (req.user) {
      const actor = req.user.username || 'anonymous';
      const action = deriveAction(req.method, req.path);
      const targetId = req.params?.id || req.params?.name || null;
      const outcome = res.statusCode < 400 ? 'success' : 'failure';
      const detail = JSON.stringify({ method: req.method, path: req.path, status: res.statusCode });

      try {
        write({ actor, action, targetId, outcome, detail });
      } catch (err) {
        // Never let audit failures break the response
        console.error('Audit log write failed:', err);
      }
    }

    return originalJson(body);
  };

  next();
}
