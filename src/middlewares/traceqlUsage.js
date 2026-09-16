import { getOperationAST } from "graphql";
import { log } from "dbc-node-logger";
import config from "../config";
import { count } from "../utils/monitor";
import {
  createOperationHash,
  extractFieldKeys,
  extractInputUsage,
  getTraceqlOutcome,
} from "../utils/traceql";

const MAX_PAYLOAD_BYTES = 25 * 1024;
const MAX_FIELDS = 500;
const MAX_ARGUMENTS = 500;
const MAX_INPUT_FIELDS = 500;
const MAX_SCHEMA_ELEMENTS = 1000;
const queue = [];
let activeJobs = 0;

function metric(suffix) {
  count(`traceql_usage_${suffix}_total`);
}

function logEvent(message, details) {
  if (config.datasources.traceql.logEvents) {
    log.info(message, details);
  }
}

function isRetryable(response) {
  const status = response?.status;
  return !response?.ok && (typeof status !== "number" || status >= 500);
}

function drainQueue() {
  while (
    activeJobs < config.datasources.traceql.concurrency &&
    queue.length > 0
  ) {
    const job = queue.shift();
    activeJobs += 1;

    Promise.resolve(job.send())
      .then((response) => {
        if (response?.ok) {
          metric(response?.body?.duplicate ? "duplicate" : "accepted");
          logEvent("TraceQL usage event accepted", {
            requestId: job.requestId,
            status: response?.status,
            duplicate: Boolean(response?.body?.duplicate),
            attempt: job.attempt + 1,
            fieldCount: job.fieldCount,
            operationName: job.operationName,
          });
          return;
        }

        if (
          isRetryable(response) &&
          job.attempt < config.datasources.traceql.maxRetries
        ) {
          metric("retry");
          const delayMs = 100 * 2 ** job.attempt;
          logEvent("TraceQL usage event scheduled for retry", {
            requestId: job.requestId,
            status: response?.status,
            attempt: job.attempt + 1,
            delayMs,
          });
          setTimeout(() => {
            queue.push({ ...job, attempt: job.attempt + 1 });
            drainQueue();
          }, delayMs);
          return;
        }

        metric(`dropped_${response?.status || "network"}`);
        log.warn("TraceQL usage event was dropped", {
          requestId: job.requestId,
          status: response?.status,
        });
      })
      .catch((error) => {
        if (job.attempt < config.datasources.traceql.maxRetries) {
          metric("retry");
          const delayMs = 100 * 2 ** job.attempt;
          logEvent("TraceQL usage event scheduled for retry", {
            requestId: job.requestId,
            attempt: job.attempt + 1,
            delayMs,
            error: String(error),
          });
          setTimeout(() => {
            queue.push({ ...job, attempt: job.attempt + 1 });
            drainQueue();
          }, delayMs);
        } else {
          metric("dropped_network");
          log.warn("TraceQL usage event was dropped", {
            requestId: job.requestId,
            error: String(error),
          });
        }
      })
      .finally(() => {
        activeJobs -= 1;
        drainQueue();
      });
  }
}

function enqueue(job) {
  if (queue.length + activeJobs >= config.datasources.traceql.queueMaxSize) {
    metric("dropped_queue_full");
    log.warn("TraceQL usage event was dropped", {
      requestId: job.requestId,
      reason: "queue_full",
    });
    return false;
  }
  queue.push(job);
  drainQueue();
  return true;
}

function createEvent(req, schema, document, operationName, result) {
  const operation = getOperationAST(document, operationName);
  if (!operation) {
    metric("dropped_no_operation");
    logEvent("TraceQL usage event was skipped", {
      requestId: req?.datasources?.stats?.uuid,
      reason: "no_operation",
    });
    return null;
  }
  if (!req.accessToken) {
    metric("dropped_no_access_token");
    logEvent("TraceQL usage event was skipped", {
      requestId: req?.datasources?.stats?.uuid,
      reason: "no_access_token",
      operationName: operation.name?.value,
    });
    return null;
  }
  if (!req?.datasources?.stats?.uuid) {
    metric("dropped_no_request_id");
    logEvent("TraceQL usage event was skipped", {
      reason: "no_request_id",
      operationName: operation.name?.value,
    });
    return null;
  }

  const fields = extractFieldKeys(schema, document, operationName);
  if (fields.length === 0 || fields.length > MAX_FIELDS) {
    const reason = fields.length === 0 ? "no_fields" : "too_many_fields";
    metric(`dropped_${reason}`);
    logEvent("TraceQL usage event was skipped", {
      requestId: req.datasources.stats.uuid,
      reason,
      operationName: operation.name?.value,
      fieldCount: fields.length,
    });
    return null;
  }
  const inputUsage = extractInputUsage(
    schema,
    document,
    operationName,
    req.queryVariables || {}
  );
  const schemaElementCount =
    fields.length +
    inputUsage.arguments.length +
    inputUsage.inputFields.length;
  if (
    inputUsage.arguments.length > MAX_ARGUMENTS ||
    inputUsage.inputFields.length > MAX_INPUT_FIELDS ||
    schemaElementCount > MAX_SCHEMA_ELEMENTS
  ) {
    metric("dropped_too_many_schema_elements");
    logEvent("TraceQL usage event was skipped", {
      requestId: req.datasources.stats.uuid,
      reason: "too_many_schema_elements",
      fieldCount: fields.length,
      argumentCount: inputUsage.arguments.length,
      inputFieldCount: inputUsage.inputFields.length,
    });
    return null;
  }

  const event = {
    requestId: req.datasources.stats.uuid,
    operationType: operation.operation,
    ...(operation.name?.value && { operationName: operation.name.value }),
    operationHash: createOperationHash(document, operationName),
    ...(req.profile?.agency && { agencyId: String(req.profile.agency) }),
    ...(req.profile?.name && { profileName: String(req.profile.name) }),
    outcome: getTraceqlOutcome(result),
    durationMs: Math.max(
      0,
      Math.round(performance.now() - req.traceqlUsage.startedAtMs)
    ),
    fields,
    ...(inputUsage.arguments.length > 0 && {
      arguments: inputUsage.arguments,
    }),
    ...(inputUsage.inputFields.length > 0 && {
      inputFields: inputUsage.inputFields,
    }),
    usedAt: req.traceqlUsage.usedAt,
  };

  if (Buffer.byteLength(JSON.stringify(event), "utf8") > MAX_PAYLOAD_BYTES) {
    metric("dropped_payload_too_large");
    logEvent("TraceQL usage event was skipped", {
      requestId: event.requestId,
      reason: "payload_too_large",
      operationName: event.operationName,
      fieldCount: event.fields.length,
    });
    return null;
  }
  return event;
}

export function queueTraceqlUsage(req, args, result) {
  if (!config.datasources.traceql.enabled) {
    logEvent("TraceQL usage event was skipped", {
      requestId: req?.datasources?.stats?.uuid,
      reason: "disabled",
    });
    return false;
  }
  if (req.traceqlUsage?.queued) {
    logEvent("TraceQL usage event was skipped", {
      requestId: req?.datasources?.stats?.uuid,
      reason: "already_queued",
    });
    return false;
  }

  const event = createEvent(
    req,
    args.schema,
    args.document,
    args.operationName,
    result
  );
  if (!event) {
    return false;
  }

  const loader = req.datasources.getLoader("traceqlUsage");
  const accepted = enqueue({
    requestId: event.requestId,
    operationName: event.operationName,
    fieldCount: event.fields.length,
    attempt: 0,
    send: () => loader.clear(event).load(event),
  });
  if (accepted) {
    req.traceqlUsage.queued = true;
    metric("queued");
    logEvent("TraceQL usage event queued", {
      requestId: event.requestId,
      operationName: event.operationName,
      operationType: event.operationType,
      outcome: event.outcome,
      fieldCount: event.fields.length,
    });
  }
  return accepted;
}

export function traceqlUsageMiddleware(req, res, next) {
  req.traceqlUsage = {
    usedAt: new Date().toISOString(),
    startedAtMs: performance.now(),
    queued: false,
  };
  next();
}

export const testing = {
  createEvent,
};
