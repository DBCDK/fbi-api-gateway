import {
  introspectSchema,
  wrapSchema,
  RenameTypes,
  WrapType,
} from "@graphql-tools/wrap";
import { filterSchema, pruneSchema } from "@graphql-tools/utils";
import { print } from "graphql";
import { fetch } from "../../utils/fetchWorker";

// Forward GraphQL query operations to a remote endpoint.
function createExecutor(url) {
  return async ({ document, variables, operationName }) => {
    const query = typeof document === "string" ? document : print(document);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables, operationName }),
    });

    if (!response.buffer) {
      throw new Error(
        `Remote schema request failed for ${url} with status ${response.status || "unknown"}`
      );
    }

    const text = Buffer.from(response.buffer).toString();
    const payload = JSON.parse(text);

    if (!response.ok || payload.errors?.length) {
      const message =
        payload.errors?.map((error) => error.message).join("; ") ||
        `Remote schema request failed for ${url}`;
      throw new Error(message);
    }

    return payload;
  };
}

// Capitalise the first letter of a string.
function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Fetch a remote GraphQL schema, filter it to the allowed query fields,
 * and expose it under a single namespace field in this API.
 *
 * @param {string} url           - The remote GraphQL endpoint URL.
 * @param {string} namespace     - Used as both the query field name (e.g. "bibliotekdkCms")
 *                                 and the type-name prefix (e.g. "BibliotekdkCms").
 * @param {string[]} allowedFields - Query fields to expose from the remote schema.
 */
export default async function createRemoteSchema({
  url,
  namespace,
  allowedFields = [],
}) {
  const typeNamePrefix = capitalise(namespace);
  const executor = createExecutor(url);
  const schema = await introspectSchema(executor);

  const allowedFieldSet = new Set(allowedFields.map((name) => name.trim()).filter(Boolean));

  const filteredSchema = pruneSchema(
    filterSchema({
      schema,
      rootFieldFilter: (operationType, fieldName) =>
        operationType === "Query" &&
        (allowedFieldSet.size === 0 || allowedFieldSet.has(fieldName)),
    })
  );

  const queryType = filteredSchema.getQueryType();
  const queryTypeName = queryType?.name;
  const queryFieldNames = Object.keys(queryType?.getFields?.() || {});

  if (!queryTypeName) {
    throw new Error(`Remote schema at '${url}' does not expose a query type`);
  }

  if (queryFieldNames.length === 0) {
    throw new Error(
      `Remote schema at '${url}' has no query fields left after applying the allowlist`
    );
  }

  return wrapSchema({
    schema: filteredSchema,
    executor,
    transforms: [
      new RenameTypes((name) =>
        name === queryTypeName ? name : `${typeNamePrefix}${name}`
      ),
      new WrapType(queryTypeName, typeNamePrefix, namespace),
    ],
  });
}
