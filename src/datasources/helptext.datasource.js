import request from "superagent";
import config from "../config";
import { createIndexer } from "../utils/searcher";

const toDrupalLanguage = {
  da: "en",
  en: "en-gb",
};

const fromDrupalLanguage = {
  en: "da",
  "en-gb": "en",
};

const toDrupalEnum = {
  da: "EN",
  en: "EN_GB",
};
/**
 * Fetch all help texts from the Drupal backend
 * for all languages
 */
async function get() {
  const url = config.datasources.backend.url;
  const responses = await Promise.all(
    Object.keys(toDrupalLanguage).map(async (langcode) => {
      const res = await request.post(url).send({
        query: `query {
              nodeQuery (limit:100 filter: {conditions: [
                {field: "type", value: ["help_text"]},
                {field: "status", value:"1"}
              ] }) {
                count
                entities(language:${toDrupalEnum[langcode]}) {
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
                    langcode {
                      value
                    }
                  }
                }
              }
            }`,
      });

      // Parse them, strip html tags
      const docs = res.body.data.nodeQuery.entities
        .filter(
          (text) => !!text && text.langcode.value === toDrupalLanguage[langcode]
        )
        .map((text) => ({
          id: text.nid,
          nid: text.nid,
          title: text.title,
          body: text.body.processed
            .replace(/<.*?>/g, "")
            .replace(/\n+/g, ". ")
            .replace(/\.+/g, "."),
          group: text.fieldHelpTextGroup,
          language: fromDrupalLanguage[text.langcode.value],
        }));

      return docs;
    })
  );

  let docsAllLanguages = [];

  responses.forEach((res) => {
    docsAllLanguages = [...docsAllLanguages, ...res];
  });

  return docsAllLanguages;
}

// Indexer options
const options = {
  fields: ["title", "body", "group"], // fields to index for full-text search
  storeFields: ["title", "body", "group", "language"], // fields to return with search results
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
export async function load({ q, language = "da" }) {
  const age = lastUpdateMS ? new Date().getTime() - lastUpdateMS : 0;

  if (!docs || age > timeToLiveMS) {
    // Fetch help texts
    docs = await get();
    lastUpdateMS = new Date().getTime();
  }

  const options = {
    ...searchOptions,
    filter: (result) => {
      return result.language === language;
    },
  };

  // prefix match
  let result = index.search(q, docs, options);

  if (result.length === 0) {
    // try fuzzy  match
    result = index.search(q, docs, {
      ...options,
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
