import { parse } from "graphql";

import { validateQueryDepth } from "../utils/depth";

/**
 * Validates depth of GraphQL query
 */
export async function validateDepth(req, res, next) {
  const { query } = req.body;
  try {
    // Parse queryen til en AST
    const ast = parse(query);

    // Find root-operationen (query/mutation/subscription)
    const node = ast.definitions.find(
      (def) => def.kind === "OperationDefinition"
    );

    const result = validateQueryDepth(node);

    req.queryDepth = result.value;

    if (result.statusCode !== 200) {
      res.status(res.statusCode);
      return res.send({
        statusCode: result.statusCode,
        message: result.message,
      });
    }
  } catch {}

  next();
}
