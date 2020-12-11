import { log } from "dbc-node-logger";
import client from "prom-client";

/**
 * Monitor performance of a function
 * It will record timings of calls to the given function
 *
 * @param {object} options
 * @param {string} options.name name of event to monitor
 * @param {string} options.help help text
 * @param {function} func the function to monitor
 *
 * @returns {function} wrapped function
 */
export default function monitor({ name, help }, func) {
  // Create timings histogram
  const hist = new client.Histogram({
    name,
    help,
    buckets: [0.1, 0.5, 1, 2, 5]
  });

  // Return the wrapped function
  return async function(...args) {
    // Start timer
    const end = hist.startTimer();

    try {
      return await func(...args);
    } finally {
      // End the timer
      end();
    }
  };
}

// Object that stores Prometheus Histograms
const histograms = {};

/**
 * Create a histogram for some name
 * If no histogram of the name exists, it will be created
 * If too many histograms are created, error is thrown
 * @param {string} name
 */
export function createHistogram(name) {
  let hist = histograms[name];
  if (!hist) {
    if (Object.keys(histograms).length > 99) {
      throw new Error(`Too many observations created`);
    }
    hist = new client.Histogram({
      name,
      help: "Histogram for durations",
      buckets: [0.1, 0.5, 1, 2, 5]
    });
    histograms[name] = hist;
  }
  return hist;
}

/**
 * Observe a duration for a histogram of some name
 * If no histogram of the name exists, it will be created
 * @param {string} name
 * @param {number} duration
 */
export function observeDuration(name, duration) {
  try {
    const hist = createHistogram(name);
    hist.observe(duration);
  } catch (e) {
    log.error(`Could not observe duration for name ${name}: ${e.message}`);
  }
}

const counters = {};

/**
 * Increment count by name
 * If no counter of the name exists, it will be created
 * @param {string} name
 */
export function count(name) {
  let counter = counters[name];
  if (!counter) {
    counter = new client.Counter({
      name,
      help: "A counter"
    });
    counters[name] = counter;
  }
  counter.inc();
}

/**
 * Route handler for the metrics endpoint
 *
 */
export async function metrics(req, res) {
  res.send(client.register.metrics());
}
