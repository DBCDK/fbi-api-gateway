import { log } from "dbc-node-logger";
import queryComplexity from "graphql-query-complexity";

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
function CustomFieldEstimator({ field, childComplexity }) {
  const fieldType = field.type.toString();
  const isExpensiveArray =
    fieldType.startsWith("[") &&
    !fieldType.startsWith("[String") &&
    !fieldType.startsWith("[Int") &&
    !fieldType.startsWith("[Creator") &&
    !fieldType.startsWith("[TextWithWork") &&
    !fieldType.startsWith("[MaterialType");
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
 * option in express-graphql.
 * https://github.com/graphql/express-graphql
 *
 * We use the graphql-query-complexity for creating the rule
 * https://github.com/slicknode/graphql-query-complexity
 *
 * @param {object} params
 * @param {string} params.query
 * @param {object} params.variables
 */
export default function validateComplexity({ query, variables }) {
  return queryComplexity({
    estimators: [CustomFieldEstimator],
    maximumComplexity: config.query.maxComplexity,
    variables,
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
