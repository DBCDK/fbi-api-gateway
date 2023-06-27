import { log } from "dbc-node-logger";
import { parse, GraphQLError } from "graphql";

import queryComplexity, {
  getComplexity,
  simpleEstimator,
  directiveEstimator,
} from "graphql-query-complexity";

import config from "../config";

// START OF BLOCK

/*
  This block of code can be removed when the new validateQueryComplexity function 
  is fully integrated in FBI-API. This means that the complexity test period is over 
  (Where complexity is only logged and all complexity values is adjustet)
  and FBI-API now has SLA measures. 
*/

/**
 * A custom field estimator
 * https://github.com/slicknode/graphql-query-complexity#creating-custom-estimators
 *
 * This function is called per field.
 * If field is an array we multiply with the complexity value
 * of its children. This makes highly nested queries expensive.
 *
 * @param {ComplexityEstimatorArgs} params
 * @param {GraphQLField<any, any>} params.field
 * @param {number} params.childComplexity
 */
function customFieldEstimator({ field, childComplexity }) {
  const fieldType = field.type.toString();
  const isExpensiveArray =
    fieldType.startsWith("[Work!]") ||
    fieldType.startsWith("[Work]") ||
    fieldType.startsWith("[Manifestation");

  if (isExpensiveArray) {
    return 100 * (childComplexity || 1);
  }
  return childComplexity;
}
/**
 * Statically validates the complexity of a query
 * I.e. it calculates complexity before query execution
 *
 * It should be added as an entry in the validationRules
 *
 * We use the graphql-query-complexity for creating the rule
 * https://github.com/slicknode/graphql-query-complexity
 *
 * @param {object} params
 * @param {string} params.query
 * @param {object} params.variables
 */

const OLD_BUT_STILL_USED_MAX_COMPLEXITY = 100000;

export function validateComplexity({ query, variables }) {
  return queryComplexity({
    estimators: [customFieldEstimator],
    maximumComplexity: OLD_BUT_STILL_USED_MAX_COMPLEXITY,
    variables,
    onComplete: (complexity) => {
      if (complexity > OLD_BUT_STILL_USED_MAX_COMPLEXITY) {
        log.error("Query exceeded complexity limit", {
          complexity,
          query,
          maxComplexity: OLD_BUT_STILL_USED_MAX_COMPLEXITY,
        });
      }
    },
  });
}

// END OF BLOCK

/**
 * Function to build the content for the estimator functions
 *
 * @param {*} params.query
 * @param {*} params.variables
 * @param {object} params.schema
 * @returns {object}
 */
export function buildQueryComplexity({ schema, query, variables }) {
  return {
    estimators: [
      directiveEstimator(),
      simpleEstimator({
        defaultComplexity: 1,
      }),
    ],
    schema,
    maximumComplexity: config.query.maxComplexity,
    query: parse(query),
    variables,
    createError: (max, actual) => {
      return new GraphQLError(
        `Query is too complex: ${actual}. Maximum allowed complexity: ${max}`
      );
    },
    onComplete: (complexity) => {
      if (complexity > config.query.maxComplexity) {
        log.error("Query exceeded complexity limit", {
          complexity,
          query,
          maxComplexity: config.query.maxComplexity,
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
    console.error("Could not calculate complexity", e.message);
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
    console.error("Could not calculate complexity", e.message);
  }
}
