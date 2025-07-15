import { introspectSchema, wrapSchema, RenameTypes } from "@graphql-tools/wrap";
import { print } from "graphql";
import config from "../../config";
import drupalSchema from "./drupalSchema.json";
import { fetch } from "../../utils/fetchWorker";

const executor = async ({ document, variables }) => {
  const query = print(document);
  const url = config.datasources.backend.url;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  // fetchWorker returns { status, ok, buffer, timings }
  // We need to parse the buffer as JSON
  const text = Buffer.from(response.buffer).toString();
  return JSON.parse(text);
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
