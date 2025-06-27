import { AsyncLocalStorage, createHook, executionAsyncId } from "async_hooks";
import { performance } from "perf_hooks";

// 🔧 AsyncLocalStorage is used to maintain a context object per request.
// This context follows the full asynchronous execution path – even across await, promises, timeouts, etc.
// Without this, we’d lose track of "who owns" the current execution when deep inside async flows.
const als = new AsyncLocalStorage();

// 🗺️ This map links async IDs (from async_hooks) to their associated request context.
// When new async resources are created (e.g. via `await` or `setTimeout`), they inherit the context
// from the async resource that created them.
const asyncContextMap = new Map();

// ⚙️ We register an async hook to track when each async resource is initialized (init),
// entered (before), exited (after), and destroyed (cleanup).
//
// This is the key to measuring **true CPU execution time** per request, not just wall time.
//
// We do this by recording timestamps in `before()` (execution enters async context),
// and calculating deltas in `after()` (execution exits context).
const hook = createHook({
  init(asyncId, type, triggerAsyncId) {
    // 🔄 Inherit the context from the async resource that triggered this one
    if (asyncContextMap.has(triggerAsyncId)) {
      asyncContextMap.set(asyncId, asyncContextMap.get(triggerAsyncId));
    }
  },

  before(asyncId) {
    // ✅ Execution is about to enter an async resource
    // If this resource is associated with a tracked request, mark entry time
    const ctx = asyncContextMap.get(asyncId);
    if (ctx && ctx._entryTime === null) {
      ctx._entryTime = performance.now();
    }
  },

  after(asyncId) {
    // ⏱️ Execution is exiting the async resource.
    // We compute how long we’ve been actively executing *in this specific request’s context*.
    const ctx = asyncContextMap.get(asyncId);
    if (ctx && ctx._entryTime !== null) {
      const now = performance.now();
      ctx.estimatedCpuTimeMs += now - ctx._entryTime;
      ctx._entryTime = null;
    }
  },

  destroy(asyncId) {
    // 🧹 Clean up once an async resource is no longer needed
    asyncContextMap.delete(asyncId);
  },
});

// Track if hook is enabled to avoid enabling it multiple times
let hookEnabled = false;

/**
 * 🔍 Express middleware to track CPU time per request.
 *
 * This is the entry point for each incoming request.
 * It sets up the initial tracking context, binds it to the current async execution ID,
 * and wires up cleanup logic to run when the response is finished.
 *
 * The context is stored in both AsyncLocalStorage and the asyncContextMap
 * to ensure we can track time accurately across all async hops.
 */
/**
 * 🔍 Express middleware to track CPU time per request.
 *
 * This is the entry point for each incoming request.
 * It sets up the initial tracking context, binds it to the current async execution ID,
 * and wires up cleanup logic to run when the response is finished.
 *
 * The context is stored in both AsyncLocalStorage and the asyncContextMap
 * to ensure we can track time accurately across all async hops.
 */
export default function estimatedCpuTimeMiddleware(req, res, next) {
  // Only enable the hook once when the middleware is first used
  if (!hookEnabled) {
    hook.enable();
    hookEnabled = true;
  }

  const context = {
    estimatedCpuTimeMs: 0, // Total accumulated time spent executing code for this request
    _entryTime: null, // Timestamp for current "entered" async block
  };

  // Start the ALS context. Everything inside this callback (and all async descendants)
  // will have access to this context via als.getStore().
  als.run(context, () => {
    // Capture the current async ID and associate it with this context
    const asyncId = executionAsyncId();
    asyncContextMap.set(asyncId, context);

    // Attach the context to the request for later access (e.g. logging)
    req.cpuTracker = context;

    // When the request finishes, clean up
    res.on("finish", () => {
      asyncContextMap.delete(asyncId);
    });

    next();
  });
}
