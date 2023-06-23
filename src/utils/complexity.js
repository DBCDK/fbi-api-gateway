import { log } from "dbc-node-logger";
import { parse } from "graphql";

import queryComplexity, {
  getComplexity,
  simpleEstimator,
  directiveEstimator,
} from "graphql-query-complexity";

import config from "../config";

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
export function validateComplexity({ query, variables }) {
  return queryComplexity({
    estimators: [customFieldEstimator],
    maximumComplexity: config.query.maxComplexity,
    variables,
    createError: (max, actual) =>
      new GraphQLError(
        `Query is too complex: ${actual}. Maximum allowed complexity: ${max}`
      ),
    onComplete: (complexity) => {
      if (complexity > config.query.maxComplexity) {
        log.error("Query exceeded complexity limit", {
          complexity,
          query,
          maxComplexity: config.query.maxComplexity,
        });
      }
    },
  });
}

// function customEstimator({
//   type,
//   field,
//   node,
//   args,
//   childComplexity,
//   context,
// }) {}

/**
 *
 * @param {*} params.query
 * @param {*} params.variables
 * @param {object} params.schema
 */

export function getQueryComplexity({ query, variables, schema }) {
  try {
    return getComplexity({
      estimators: [
        directiveEstimator(),
        // customEstimator,
        simpleEstimator({
          defaultComplexity: 1,
        }),
      ],
      schema,
      query: parse(query),
      variables,
      createError: (max, actual) =>
        new GraphQLError(
          `Query is too complex: ${actual}. Maximum allowed complexity: ${max}`
        ),
    });
  } catch (e) {
    // Log error in case complexity cannot be calculated (invalid query, misconfiguration, etc.)
    console.error("Could not calculate complexity", e.message);
  }
}
