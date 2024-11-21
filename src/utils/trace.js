import { nanoid } from "nanoid";
// import { v4 as uuid } from "uuid";

// In-memory counter
let counter = 0;

// A unique instance ID
let instanceId = nanoid(5);

/**
 * Generates a unique trace ID for tracking interactions.
 *
 * The trace ID consists of three components:
 * 1. A static instance ID (5-character string unique to the instance).
 * 2. A timestamp in milliseconds since the Unix epoch, ensuring uniqueness over time.
 * 3. An incrementing counter to prevent collisions within the same instance and millisecond.
 *
 * **Robustness during restarts:**
 * - The inclusion of a timestamp makes the trace ID resilient to instance restarts.
 * - Even if the instance ID and counter reset after a restart, the timestamp ensures the trace ID remains unique.
 *
 * **Performance**
 * - instanceId is created only when instance starts
 * - Very fast, since we only rely on a counter and a timestamp, for creating a traceId
 */
export function createTraceId() {
  const paddedCounter = String(counter++).padStart(5, "0"); // Pad counter to 5 characters
  return `${instanceId}${new Date().getTime()}${paddedCounter}`;
}

function createEventContext(context) {
  // console.log(context);
  return { systemId: context?.smaug?.app?.clientId };
}

export function createSearchEvent({ input, works }, context) {
  const eventContext = createEventContext(context);
  const variables = { q: input?.q, offset: input?.offset, limit: input?.limit };
  const identifiers = works?.map((w) => ({
    identifier: w.workId,
    traceId: w.traceId,
  }));
  return {
    kind: "SEARCH",
    variables,
    result: {
      identifiers,
    },
  };
}
