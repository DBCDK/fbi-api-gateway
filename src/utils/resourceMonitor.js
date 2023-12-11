/**
 * @file Logs CPU and memory usage in an interval
 */
import { log } from "dbc-node-logger";
import { cpuUsage, memoryUsage } from "process";

const INTERVAL_MS = 10000;

let previousCpuUsage = cpuUsage();
let previousTime = performance.now();

/**
 * Will start resource monitoring
 */
export function start() {
  setInterval(() => {
    const currentTime = performance.now();
    let duration = currentTime - previousTime;

    const currentCpuUsage = cpuUsage();

    // Calculating CPU load for the duration
    const user =
      (currentCpuUsage.user - previousCpuUsage.user) / 1000 / duration;
    const system =
      (currentCpuUsage.system - previousCpuUsage.system) / 1000 / duration;

    // Set current to previous
    previousCpuUsage = currentCpuUsage;
    previousTime = currentTime;

    log.info("RESOURCE_MONITOR", {
      diagnostics: {
        cpuUsage: { user, system },
        memoryUsage: memoryUsage(),
      },
    });
  }, INTERVAL_MS);
}
