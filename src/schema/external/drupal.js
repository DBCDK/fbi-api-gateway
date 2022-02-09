import request from "superagent";
import { introspectSchema, wrapSchema, RenameTypes } from "@graphql-tools/wrap";
import { print } from "graphql";
import config from "../../config";

const executor = async ({ document, variables }) => {
  const query = print(document);
  const url = config.datasources.backend.url;
  const fetchResult = await request.post(url).send({ query, variables });
  return await fetchResult.body;
};

// Avoid naming conflicts with internal schema
const typeNameMap = {
  User: "DrupalUser",
};

export default async () => {
  const executableSchema = wrapSchema({
    schema: await introspectSchema(executor),
    executor,
    transforms: [new RenameTypes((name) => typeNameMap[name] || name)],
  });

  return executableSchema;
};
