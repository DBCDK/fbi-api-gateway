import { createMockedDataLoaders } from "../datasourceLoader";
import { printSchema, buildClientSchema } from "graphql";
import { performTestQuery } from "../utils/utils";
import permissions from "../permissions.json";

const introspectionQuery = `
query IntrospectionQuery {
  __schema {
    
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

test("complete access to whole schema", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      // If smaug === null, we get access to the entire schema without data
      smaug: null,
    },
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});

test("limited access to root fields", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {},
    },
    clientPermissions: { gateway: { allowRootFields: ["help"] } },
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});

test("remove all fields by type", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {},
    },
    clientPermissions: {
      gateway: {
        allowRootFields: ["manifestation"],
        denyTypes: ["Cover"],
      },
    },
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});

test("default schema transform", async () => {
  const result = await performTestQuery({
    query: introspectionQuery,
    variables: {},
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {},
    },
    clientPermissions: {},
  });

  expect(printSchema(buildClientSchema(result.data))).toMatchSnapshot();
});
