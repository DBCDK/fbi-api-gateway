/**
 * @file Contains functionality for indexing documents
 */

import { log } from "dbc-node-logger";
import MiniSearch from "minisearch";

/**
 *
 * @param {array} docs Documents to index
 */
export function createIndexer({ options }) {
  // The documents to index
  let _docs;

  // The index
  let _index;

  const doIndex = (docs) => {
    //Check if these are already indexed
    if (_docs !== docs) {
      _docs = docs;

      const now = performance.now();
      // Create the index
      _index = new MiniSearch(options);

      // And index
      _index.addAll(_docs);

      log.info(`Indexed documents: ${_docs.length}`, {
        total_ms: Math.round(performance.now() - now),
      });
    }
  };

  return {
    search: (q, docs, extra) => {
      doIndex(docs);
      const res = _index
        .search(q, extra)
        .slice(0, (extra && extra.limit) || 9999)
        .map((doc) => {
          // These are the unique matched terms found in the doc
          const matchedTerms = doc.terms;

          doc.highlights = {};

          // Sorth them long to short
          matchedTerms.sort((m1, m2) => m2.length - m1.length);

          // create highlights and trim content
          options.fields.forEach((field) => {
            const value = doc[field];
            // check if field exist
            if (!value) {
              return {};
            }

            // handle multivalued fields
            const values = Array.isArray(value) ? value : [value];
            let bestMatchForMultiValuedFields;

            values.forEach((v) => {
              // split by space, and highlight parts
              const split = v.split(/\s+/).map((text) => {
                for (let i = 0; i < matchedTerms.length; i++) {
                  const match = matchedTerms[i];
                  const processedText = options.processTerm
                    ? options.processTerm(text)
                    : text;

                  if (processedText.includes(match)) {
                    return {
                      highlight: true,
                      text: `<mark>${text}</mark>`,
                    };
                  }
                }
                return { highlight: false, text };
              });

              // Find text area with most highlights close together
              let count = 0;
              let highestCount = 0;
              let offset = 0;
              const max = 36;
              let atBeginning = false;
              let atEnd = false;
              for (let i = 0; i < split.length; i++) {
                if (split[i].highlight === true) {
                  count++;
                }
                if (split[i - max] && split[i - max].highlight === true) {
                  count--;
                }
                if (count > highestCount) {
                  highestCount = count;
                  offset = i - max;
                }
              }

              // We found offset, where most occurences are found
              // try to center the matches
              offset = Math.floor(offset + max / 2);

              if (offset + max >= split.length - 1) {
                offset = split.length - max;
                atEnd = true;
              }
              if (offset <= 0) {
                offset = 0;
                atBeginning = true;
              }
              if (
                typeof bestMatchForMultiValuedFields === "undefined" ||
                highestCount > bestMatchForMultiValuedFields
              ) {
                doc.highlights[field] = `${atBeginning ? "" : "... "}${split
                  .map((term) => term.text)
                  .slice(offset, offset + max)
                  .join(" ")}${atEnd ? "" : " ..."}`;
                bestMatchForMultiValuedFields = highestCount;
              }
            });
          });

          return doc;
        });

      return res;
    },
  };
}
