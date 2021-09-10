import { graphql } from "graphql";
import { validate } from "graphql/validation";
import { parse } from "graphql/language";
import { internalSchema } from "../schemaLoader";
import { createMockedDataLoaders } from "../datasourceLoader";

export async function performTestQuery({ query, variables, context }) {
  return graphql(internalSchema, query, null, context, variables);
}

test("InfomediaContent, 2 articles", async () => {
  const result = await performTestQuery({
    query: `
        query ($pid: String!) {
          infomediaContent(pid:$pid){
            id
            html
          }
        }
        `,
    variables: { pid: "870971-avis:34591016" },
    context: { datasources: createMockedDataLoaders() },
  });

  expect(result).toMatchSnapshot();
});

test("InfomediaContent, single article", async () => {
  const result = await performTestQuery({
    query: `
        query ($pid: String!) {
          infomediaContent(pid:$pid){
            id
            html
          }
        }
        `,
    variables: { pid: "870971-anmeld:47413281" },
    context: { datasources: createMockedDataLoaders() },
  });

  expect(result).toMatchSnapshot();
});

test("InfomediaContent, multiple reviews", async () => {
  const result = await performTestQuery({
    query: `
        query ($pid: String!) {
          infomediaContent(pid:$pid){
            id
            html
          }
        }
        `,
    variables: { pid: "870971-anmeld:47413281" },
    context: { datasources: createMockedDataLoaders() },
  });

  expect(result).toMatchSnapshot();
});

test("Manifestation -> onlineAccess returns InfomediaReference", async () => {
  const result = await performTestQuery({
    query: `
        query ($pid: String!) {
         manifestation(pid:$pid){
            pid
            onlineAccess {
                ... on InfomediaReference {
                  type
                  infomediaId
                  
                }
            }
          }
        }
        `,
    variables: { pid: "870971-anmeld:47413281" },
    context: {
      accessToken: "qwerty",
      datasources: createMockedDataLoaders(),
    },
  });

  expect(result).toMatchSnapshot();
});
