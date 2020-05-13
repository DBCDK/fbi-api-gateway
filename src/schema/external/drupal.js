import request from 'superagent';
import {introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools';
import {print} from 'graphql';

const fetcher = async ({query: queryDocument, variables, operationName}) => {
  const query = print(queryDocument);
  const fetchResult = await request
    .post(
      'http://bibdk-backend-www-master.frontend-staging.svc.cloud.dbc.dk/graphql'
    )
    .send({query, variables, operationName});
  return await fetchResult.body;
};

export default async () => {
  const schema = await introspectSchema(fetcher);

  const executableSchema = makeRemoteExecutableSchema({
    schema,
    fetcher
  });

  return executableSchema;
};
