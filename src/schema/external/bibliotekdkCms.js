import config from "../../config";
import createRemoteSchema from "./createRemoteSchema";
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
];

export default () =>
  createRemoteSchema({
    url: config.datasources.bibliotekdkCms.url,
    namespace: "bibliotekdkCms",
    allowedFields: allowedFields,
  });
