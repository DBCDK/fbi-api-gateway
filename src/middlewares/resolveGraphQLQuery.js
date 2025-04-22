//
import { createHandler } from "graphql-http/lib/use/express";
//
import { GraphQLError } from "graphql";
import {
  validateQueryComplexity,
  getQueryComplexity,
  getQueryComplexityClass,
} from "../utils/complexity";
import { getExecutableSchema } from "../schemaLoader";
import hasExternalRequest from "../utils/externalRequest";

import isFastLaneQuery, { getFastLane } from "../middlewares/fastLane";
import { log } from "dbc-node-logger";

/**
 * Resolves the GraphQL query
 */
export async function resolveGraphQLQuery(req, res, next) {
  const schema = await getExecutableSchema({
    clientPermissions: { gateway: { ...req?.smaug?.gateway } },
    hasAccessToken: !!req.accessToken,
  });

  const { query, variables } = req.body;

  // smaug client custom complexity limit
  const maxQueryComplexity = req?.smaug?.gateway?.maxQueryComplexity;

  // Set incomming query complexity
  req.queryComplexity = getQueryComplexity({
    query,
    variables,
    schema,
    maxQueryComplexity,
  });

  // Get query complexity category (simple|complex|critical|rejected)
  req.queryComplexityClass = getQueryComplexityClass(req.queryComplexity);

  req.withExternalRequest = hasExternalRequest(req?.datasources);

  // Set SLA headers
  res.set({
    "dbcdk-clientId": req?.smaug?.app?.clientId,
    "dbcdk-complexityClass": req.queryComplexityClass,
    "dbcdk-traceId": req?.datasources?.stats.uuid,
    "dbcdk-withExternalRequest": req?.withExternalRequest,
  });

  // check if the query allows for fast lane
  req.fastLane =
    !req.isIntrospectionQuery && isFastLaneQuery(req.queryDocument, schema);

  if (req.fastLane) {
    req.fastLaneKey = JSON.stringify({
      query,
      variables,
      profile: req.profile,
    });
    const fastLaneRes = await getFastLane(
      req.fastLaneKey,
      req.datasources.stats
    );
    if (fastLaneRes) {
      req.fastLaneRes = true;
      return res.send(fastLaneRes);
    }
  }

  const handler = createHandler({
    schema,
    validationRules: [
      validateQueryComplexity({ query, variables, maxQueryComplexity }),
    ],
    context: req,
    onOperation: async (_, arg, graphQLRes) => {
      const now = performance.now();
      if (Array.isArray(req.onOperationComplete)) {
        for (let i = 0; i < req.onOperationComplete.length; i++) {
          const func = req.onOperationComplete[i];
          try {
            await func(graphQLRes?.data, variables, query);
          } catch (error) {
            log.error("Error calling onOperationComplete function", {
              error: String(error),
              stacktrace: error.stack,
            });
          }
        }
      }

      // Attach collected debug data (if any) to the GraphQL response under `extensions.debug`
      if (req.datasourcesDebug) {
        graphQLRes.extensions = {
          ...(graphQLRes.extensions || {}),
          debug: req.datasourcesDebug,
        };
      }

      req.onOperationCompleteDuration = performance.now() - now;
    },
    formatError: (graphQLError) => {
      if (!req.graphQLErrors) {
        req.graphQLErrors = [];
      }

      // Loop through errors until we find the most original error
      let originalError = graphQLError;
      while (originalError?.originalError) {
        originalError = originalError?.originalError;
      }

      const isInternalError = !(originalError instanceof GraphQLError);

      const errorForLog = isInternalError
        ? {
            ...graphQLError,
            message: "Internal server error. " + graphQLError?.message,
          }
        : graphQLError;

      req.graphQLErrors.push(errorForLog);

      if (isInternalError) {
        // If this is an internal server error, we dont show the actual error to the user
        // Instead we provide a trackingId that can be used to find the real message in the logs
        return {
          message: "Internal server error",
          trackingId: req?.datasources?.stats?.uuid || null,
        };
      } else {
        // Typically a query error that is passed directly to the user
        return graphQLError;
      }
    },
  });

  return handler(req, res);
}
