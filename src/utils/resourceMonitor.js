/**
 * @file Logs CPU and memory usage in an interval
 */
import { log } from "dbc-node-logger";
import { cpuUsage, memoryUsage } from "process";
import { PerformanceObserver, monitorEventLoopDelay } from "perf_hooks";

const eventLoopDelay = monitorEventLoopDelay();
eventLoopDelay.enable();

const INTERVAL_MS = 10000;

let previousCpuUsage = cpuUsage();
let previousTime = performance.now();
let gc = {
  count: 0,
  totalDuration: 0,
};
let activeConnections = 0;

const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    gc.count += 1;
    gc.totalDuration += entry.duration;
  });
});

obs.observe({ entryTypes: ["gc"] });

/**
 * Will start resource monitoring
 */
export function start(server) {
  server.on("connection", (socket) => {
    activeConnections += 1;

    // Decrement on socket close
    socket.on("close", () => {
      activeConnections -= 1;
    });
  });

  setInterval(async () => {
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
        network: {
          activeConnections,
        },
        gc: {
          count: gc.count,
          totalDurationMs: Math.round(gc.totalDuration),
        },
        eventLoopDelay: {
          mean: Math.round(eventLoopDelay.mean / 1e6),
          max: Math.round(eventLoopDelay.max / 1e6),
        },
      },
    });
    gc.count = 0;
    gc.totalDuration = 0;
    eventLoopDelay.reset();
  }, INTERVAL_MS);
}
