// enumFallbackDirective.test.js
import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql } from "graphql";
import enumFallbackDirective from "../enumFallbackDirective";

const typeDefs = `

  enum Hest {
    PONY
    DANSK_VARMBLOD @fallback
  }

  enum Fisk {
    ABORRE
    ANSJOS
  }

  type Query {
    hest: Hest!
    fisk: Fisk
  }
`;

const createSchemaWithResolvers = (resolver) => {
  const resolvers = resolver
    ? {
        Query: {
          hest: resolver,
          fisk: resolver,
        },
      }
    : {};

  const { enumFallbackDirectiveTypeDefs, enumFallbackDirectiveTransformer } =
    enumFallbackDirective();

  let schema = makeExecutableSchema({
    typeDefs: [enumFallbackDirectiveTypeDefs, typeDefs],
    resolvers,
  });

  schema = enumFallbackDirectiveTransformer(schema);

  return schema;
};

describe("enumFallbackDirective", () => {
  it("returns null when resolver returns null for nullable field", async () => {
    const schema = createSchemaWithResolvers(() => null);
    const result = await graphql(schema, "{ fisk }");
    expect(result.data.fisk).toBe(null);
  });
  it("returns fallback (first entry, no directive given) when resolver returns unsupported value", async () => {
    const schema = createSchemaWithResolvers(() => "BAMSE");
    const result = await graphql(schema, "{ fisk }");
    expect(result.data.fisk).toBe("ABORRE");
  });
  it("returns value from resolver, when it is supported", async () => {
    const schema = createSchemaWithResolvers(() => "ANSJOS");
    const result = await graphql(schema, "{ fisk }");
    expect(result.data.fisk).toBe("ANSJOS");
  });
  it("returns fallback (from directive) when resolver returns null for NON nullable field", async () => {
    const schema = createSchemaWithResolvers(() => null);
    const result = await graphql(schema, "{ hest }");
    expect(result.data.hest).toBe("DANSK_VARMBLOD");
  });
  it("returns fallback (from directive) when resolver returns unsupported value", async () => {
    const schema = createSchemaWithResolvers(() => "BAMSE");
    const result = await graphql(schema, "{ hest }");
    expect(result.data.hest).toBe("DANSK_VARMBLOD");
  });
  it("returns value from resolver, when it is supported", async () => {
    const schema = createSchemaWithResolvers(() => "PONY");
    const result = await graphql(schema, "{ hest }");
    expect(result.data.hest).toBe("PONY");
  });
});
