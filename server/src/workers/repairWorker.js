import { config } from "../config/env.js";
import { reconcileFiles, repairShards } from "../services/repair.service.js";

let timer;
export async function runRepairPass() {
  const repaired = await repairShards();
  const reconciled = await reconcileFiles();
  return { ...repaired, ...reconciled };
}

export function startRepairWorker() {
  if (timer) return;
  timer = setInterval(() => runRepairPass().catch((error) => console.error("Repair pass failed", error)), 60_000);
  timer.unref?.();
  return timer;
}

export const repairIntervalMinutes = config.pendingTimeoutMinutes;
