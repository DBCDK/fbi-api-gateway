import { log } from "dbc-node-logger";
import { parse, GraphQLError } from "graphql";

import queryComplexity, {
  getComplexity,
  simpleEstimator,
  directiveEstimator,
} from "graphql-query-complexity";

import config from "../config";

/**
 * Function to build the content for the estimator functions
 *
 * @param {*} params.query
 * @param {*} params.variables
 * @param {object} params.schema
 * @returns {object}
 */
export function buildQueryComplexity({
  schema = null,
  query,
  variables,
  maxQueryComplexity = null,
}) {
  // Set the complexity limit (custom or default/config)
  const COMPLEXITY_LIMIT = maxQueryComplexity || config.query.maxComplexity;

  return {
    estimators: [
      directiveEstimator(),
      simpleEstimator({
        defaultComplexity: 1,
      }),
    ],
    schema,
    maximumComplexity: COMPLEXITY_LIMIT,
    query: parse(query),
    variables,
    createError: (max, actual) => {
      return new GraphQLError(
        `Query is too complex: ${actual}. Maximum allowed complexity: ${max}`
      );
    },
    onComplete: (complexity) => {
      if (complexity > COMPLEXITY_LIMIT) {
        log.error("Query exceeded complexity limit", {
          complexity,
          query,
          clientConfiguredLimit: !!maxQueryComplexity,
          maxComplexity: COMPLEXITY_LIMIT,
        });
      }
    },
  };
}

/**
 * Future complexity estimator (returns validation function)
 *
 * @param {*} params.query
 * @param {*} params.variables
 * @param {object} params.schema
 * @returns {funciton}
 */

export function validateQueryComplexity(params) {
  try {
    return queryComplexity(buildQueryComplexity(params));
  } catch (e) {
    // Log error in case complexity cannot be calculated (invalid query, misconfiguration, etc.)
  }
}

/**
 * Future complexity estimator (returns complexity value)
 *
 * @param {*} params.query
 * @param {*} params.variables
 * @param {object} params.schema
 * @returns {int}
 */

export function getQueryComplexity(params) {
  try {
    return getComplexity(buildQueryComplexity(params));
  } catch (e) {
    // Log error in case complexity cannot be calculated (invalid query, misconfiguration, etc.)
  }
}

/**
 *
 * @param {int} complexity
 * @returns {string}
 */
export function getQueryComplexityClass(complexity) {
  if (complexity < 250) {
    return "simple";
  }
  if (complexity < 2500) {
    return "complex";
  }
  if (complexity < 25000) {
    return "critical";
  }

  return "rejected";
}
