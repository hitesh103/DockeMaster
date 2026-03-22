import { registerJobClient } from '../services/deploy_service.js';

export function handleGitLogsWs(ws, req, jobId) {
  registerJobClient(jobId, ws);
}
