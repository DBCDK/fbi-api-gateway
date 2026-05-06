import config from "../../config";
import createRemoteSchema from "./createRemoteSchema";
import schemaSnapshot from "./bibliotekdkCmsSchema.json";
// Add allowed bibliotekdkCms query fields here. Other query fields from the remote schema are not exposed.
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

export default () => createRemoteSchema(schemaOptions);

export const localSchema = () =>
  createRemoteSchema({
    ...schemaOptions,
    schemaSnapshot,
  });
