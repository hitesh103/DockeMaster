import Docker from 'dockerode';
import db from '../db/db.js';

// In-memory map of nodeId → Dockerode instance
const nodeInstances = new Map();

export function addNode({ id, ip_address, port, tls_cert }) {
  const opts = { host: ip_address, port: port || 2376 };
  if (tls_cert) {
    // tls_cert stored as PEM string — basic TLS support
    opts.ca = tls_cert;
    opts.protocol = 'https';
  } else {
    opts.protocol = 'http';
  }
  const instance = new Docker(opts);
  nodeInstances.set(String(id), instance);
  return instance;
}

export function getNodeInstance(id) {
  return nodeInstances.get(String(id));
}

export async function pingNode(id) {
  const instance = getNodeInstance(id);
  if (!instance) return false;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000);
    instance.ping((err) => {
      clearTimeout(timer);
      resolve(!err);
    });
  });
}

// Load all nodes from DB and create instances on startup
export function loadNodesFromDb() {
  const nodes = db.prepare('SELECT * FROM nodes').all();
  for (const node of nodes) {
    addNode(node);
  }
}
