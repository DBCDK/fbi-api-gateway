import request from "superagent";
import { introspectSchema, wrapSchema, RenameTypes } from "@graphql-tools/wrap";
import { print } from "graphql";
import config from "../../config";
import { log } from "dbc-node-logger";

const executor = async ({ document, variables }) => {
  const query = print(document);
  const url = config.datasources.backend.url;
  const fetchResult = await request.post(url).send({ query, variables });

  return await fetchResult.body;
};

// Avoid naming conflicts with internal schema
const typeNameMap = {
  User: "DrupalUser",
  Language: "DrupalLanguage",
};

export default async () => {
  try {
    const executableSchema = wrapSchema({
      schema: await introspectSchema(executor),
      executor,
      transforms: [new RenameTypes((name) => typeNameMap[name] || name)],
    });

    return executableSchema;
  } catch (e) {
    log.error("Error fetching graphql schema from drupal backend", {
      response: e.message,
    });
    return false;
  }
};
