import { registerStatsClient } from '../services/stats_service.js';

export function handleStatsWs(ws) {
  registerStatsClient(ws);
}
