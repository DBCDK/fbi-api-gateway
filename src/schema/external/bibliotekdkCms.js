import config from "../../config";
import createRemoteSchema from "./createRemoteSchema";
// Pre-loaded local schema snapshot of bibliotekdkCms graphql schema.
import schemaSnapshot from "./bibliotekdkCmsSchema.json";
// Add allowed bibliotekdkCms query fields here. Other query fields from the schema are not exposed.
const allowedFields = [
  "faq",
  "faqs",
  "article",
  "articles",
  "notification",
  "notifications",
  "frontpage",
  "frontpages",
  "helpText",
  "helpTexts",
];

const schemaOptions = {
  url: config.datasources.bibliotekdkCms.url,
  namespace: "bibliotekdkCms",
  allowedFields,
};

//remote schema
export const remoteBibliotekdkCmsSchema = () => createRemoteSchema(schemaOptions);

/**
 * Local pre-loaded bibliotekdkCms schema snapshot.
 */
export const bibliotekdkCmsSchema = () =>
  createRemoteSchema({
    ...schemaOptions,
    schemaSnapshot,
  });
