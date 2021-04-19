import request from "superagent";
import { introspectSchema, makeRemoteExecutableSchema } from "graphql-tools";
import { print } from "graphql";
import config from "../../config";

const fetcher = async ({ query: queryDocument, variables, operationName }) => {
  const query = print(queryDocument);
  const url = config.datasources.backend.url;
  const fetchResult = await request
    .post(url)
    .send({ query, variables, operationName });
  return await fetchResult.body;
};

export default async () => {
  const schema = await introspectSchema(fetcher);

  const executableSchema = makeRemoteExecutableSchema({
    schema,
    fetcher,
  });

  return executableSchema;
};
