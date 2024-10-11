import { log } from "dbc-node-logger";
import { getOperationAST, parse } from "graphql";

function isIntrospectionQuery(operation) {
  return operation.selectionSet.selections.every((selection) => {
    const fieldName = selection.name.value;
    return fieldName.startsWith("__");
  });
}

/**
 * Validates token
 */
export async function validateToken(req, res, next) {
  // Get graphQL params
  try {
    const graphQLParams = req.body;
    const document = parse(graphQLParams.query);
    const ast = getOperationAST(document);
    req.operationName = ast?.kind === "OperationDefinition" && ast?.name?.value;

    req.queryVariables = graphQLParams.variables;
    req.parsedQuery = graphQLParams.query
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ");
    req.queryDocument = document;

    // Check if query is introspection query
    req.isIntrospectionQuery = isIntrospectionQuery(ast);
  } catch (e) {}

  // Fetch Smaug client configuration
  try {
    req.smaug =
      req.accessToken &&
      (await req.datasources.getLoader("smaug").load({
        accessToken: req.accessToken,
      }));
    req.smaug.app.ips = (req.ips.length && req.ips) || [req.ip];

    // Agency of the smaug client
    const agency = req.params?.agencyId || req.smaug?.agencyId;

    req.profile = {
      agency,
      name: req.params.profile,
      combined: `${agency}/${req.params.profile}`,
    };
  } catch (e) {
    if (e.response && e.response.statusCode !== 404) {
      log.error("Error fetching from smaug", { response: e });
      res.status(500);
      return res.send({
        statusCode: 500,
        message: "Internal server error",
      });
    }
  }

  // If query is introspection, we allow access even though
  // No token is given
  if (!req.isIntrospectionQuery) {
    // Invalid access token
    if (!req.smaug) {
      res.status(403);
      return res.send({
        statusCode: 403,
        message: "Unauthorized",
      });
    }

    // Access token is valid, but client is not configured properly
    if (!req.profile?.agency) {
      log.error(
        `Missing agency in configuration for client ${req.smaug?.app?.clientId}`
      );
      res.status(403);
      return res.send({
        statusCode: 403,
        message:
          "Invalid client configuration. Missing agency in configuration for client.",
      });
    }
  }

  next();
}
