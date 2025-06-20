import { performance } from "perf_hooks";

// Holds all active request tracking contexts
const activeCpuContexts = new Set();

let lastCpu = process.cpuUsage();

// Sample loop that attributes CPU time to all active requests
setInterval(() => {
  const currentCpu = process.cpuUsage();
  const deltaUser = currentCpu.user - lastCpu.user;
  const deltaSystem = currentCpu.system - lastCpu.system;
  const deltaMs = (deltaUser + deltaSystem) / 1000;

  lastCpu = currentCpu;

  for (const ctx of activeCpuContexts) {
    ctx.estimatedCpuTimeMs += deltaMs;
  }
}, 5);

/**
 * Express middleware that tracks CPU time per request.
 * Adds request context to the active set on entry and removes it on completion.
 */
export default function estimatedCpuTimeMs(req, res, next) {
  const context = {
    estimatedCpuTimeMs: 0,
    requestStart: performance.now(),
  };

  // Add context to global tracking set
  activeCpuContexts.add(context);

  // Clean up after request is finished
  res.on("finish", () => {
    activeCpuContexts.delete(context);
  });

  // Expose tracking data on the request object
  req.cpuTracker = context;

  next();
}
