import request from "superagent";
import config from "../config";
import { createIndexer } from "../utils/searcher";

/**
 * Fetch all help texts from the Drupal backend
 */
async function get() {
  const url = config.datasources.backend.url;
  const res = await request.post(url).send({
    query: `query {
          nodeQuery (limit:20 filter: {conditions: [
            {field: "type", value: ["help_text"]},
            {field: "status", value:"1"}
          ] }) {
            count
            entities {
            ... on NodeHelpText {
                nid
                title
                body{
                  processed
                }
                fieldHelpTextGroup
                fieldImage {
                  alt
                  title
                  url
                  width
                  height
                }
              }
            }
          }
        }`,
  });

  // Parse them, strip html tags
  const docs = res.body.data.nodeQuery.entities
    .filter((text) => !!text)
    .map((text) => ({
      id: text.nid,
      nid: text.nid,
      title: text.title,
      body: text.body.processed
        .replace(/<.*?>/g, "")
        .replace(/\n+/g, ". ")
        .replace(/\.+/g, "."),
      group: text.fieldHelpTextGroup,
    }));

  return docs;
}

// Indexer options
const options = {
  fields: ["title", "body", "group"], // fields to index for full-text search
  storeFields: ["title", "body", "group"], // fields to return with search results
};

// Default search options
const searchOptions = {
  boost: { title: 100 },
  combineWith: "AND",
  prefix: true,
};

// Create index instance
const index = createIndexer({ options });

// We cache the docs for 5 minutes
let docs;
let lastUpdateMS;
const timeToLiveMS = 1000 * 60 * 5;

/**
 *
 * @param {string} q the query
 */
async function search({ q }) {
  const age = lastUpdateMS ? new Date().getTime() - lastUpdateMS : 0;

  if (!docs || age > timeToLiveMS) {
    // Fetch help texts
    docs = await get();
    lastUpdateMS = new Date().getTime();
  }

  // prefix match
  let result = index.search(q, docs, searchOptions);

  if (result.length === 0) {
    // try fuzzy  match
    result = index.search(q, docs, {
      ...searchOptions,
      fuzzy: 0.4,
    });
  }
  result = result.map((entry) => ({
    orgTitle: entry.title,
    group: entry.group,
    title: entry.highlights.title,
    body: entry.highlights.body,
    nid: entry.id,
  }));
  return result;
}

/**
 * A DataLoader batch function
 *
 * @param {Array.<string>} keys The keys to fetch
 */
export default async function batchLoader(keys) {
  return await Promise.all(keys.map(async (key) => await search({ q: key })));
}
