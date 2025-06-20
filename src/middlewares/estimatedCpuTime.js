import { AsyncLocalStorage } from "async_hooks";
import { performance } from "perf_hooks";

// Initialize an AsyncLocalStorage instance to maintain context per request
export const als = new AsyncLocalStorage();

// Track all currently active request contexts that are being measured
const activeCpuContexts = new Set();

// Store the last recorded process-wide CPU usage
let lastCpu = process.cpuUsage();

// Global CPU sampling loop, runs every 5 milliseconds
// Measures the delta in CPU time since the last tick
// and attributes that time to all currently active contexts
setInterval(() => {
  const currentCpu = process.cpuUsage();

  // Calculate the delta in user and system CPU time since last sample
  const deltaUser = currentCpu.user - lastCpu.user;
  const deltaSystem = currentCpu.system - lastCpu.system;
  const deltaMs = (deltaUser + deltaSystem) / 1000; // Convert from microseconds to milliseconds

  lastCpu = currentCpu;

  // Attribute the delta CPU time to all active contexts
  for (const ctx of activeCpuContexts) {
    ctx.estimatedCpuTimeMs += deltaMs;
  }
}, 5);

/**
 * Express middleware that initializes per-request CPU tracking.
 * It sets up an AsyncLocalStorage context and adds the request's tracking object
 * to the global set of active contexts.
 */
export default function estimatedCpuTimeMs(req, res, next) {
  const context = {
    estimatedCpuTimeMs: 0,
    requestStart: performance.now(),
  };

  // Run the request within its own async context
  als.run(context, () => {
    // Add context to active set so it can receive CPU time updates
    activeCpuContexts.add(context);

    // When the request is finished, remove the context from the active set
    res.on("finish", () => {
      activeCpuContexts.delete(context);
    });

    // Attach the context to the request object for access in logging etc.
    req.cpuTracker = context;

    next();
  });
}
