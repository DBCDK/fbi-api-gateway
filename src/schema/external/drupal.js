import request from "superagent";
import { introspectSchema, wrapSchema, RenameTypes } from "@graphql-tools/wrap";
import { print } from "graphql";
import config from "../../config";
import drupalSchema from "./drupalSchema.json";

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
  const executableSchema = wrapSchema({
    schema: await introspectSchema(() => drupalSchema),
    executor,
    transforms: [new RenameTypes((name) => typeNameMap[name] || name)],
  });

  return executableSchema;
};

// Latest schema can be downloaded by uncommenting this
// (async () => {
//   await introspectSchema(async (...args) => {
//     const drupalSchema = await executor(...args);
//     require("fs").writeFileSync(
//       require("path").join(__dirname, "drupalSchema.json"),
//       JSON.stringify(drupalSchema, null, 2)
//     );
//     return drupalSchema;
//   });
// })();
