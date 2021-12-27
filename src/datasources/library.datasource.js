/**
 * @file Make branches searchable using a tiny js inmemory search engine
 *
 * Note, this was implemented before changing to vip-core.
 * Some day we may use the findlibrary operation to do this, but for now
 * it does not support highlighting and "one field search"
 *
 */
import { orderBy } from "lodash";
import request from "superagent";
import config from "../config";
import { createIndexer } from "../utils/searcher";

const endpoint = "/findlibrary/all?trackingId=betabib";

const fields = [
  "name",
  "agencyName",
  "agencyId",
  "branchId",
  "city",
  "postalCode",
];

// Indexer options
const options = {
  fields, // fields to index for full-text search
  storeFields: fields,
  processTerm: (term, _fieldName) =>
    term
      .toLowerCase()
      .replace("næver", "næstved")
      .replace(/æ/g, "ae")
      .replace(/ø/g, "oe")
      .replace(/å/g, "aa")
      .replace(/[\.|\,]/g, ""),
};

// Default search options
const searchOptions = {
  boost: { agencyName: 10000 },
  combineWith: "AND",
  prefix: true,
};

// exclude branches - set this to false if you do NOT want to filter
// out branches
const excludeBranches = config.datasources.vipcore.excludeBranches;

// We cache the docs for 30 minutes
let branches;
let branchesMap;
let lastUpdateMS;
let fetchingPromise;
const index = createIndexer({ options });
const timeToLiveMS = 1000 * 60 * 30;

async function get() {
  const url = config.datasources.vipcore.url + endpoint;
  let result = (await request.get(url)).body.pickupAgency;

  // Map to format supported by minisearch
  result = result.map((branch) => {
    return {
      ...branch,
      branchName:
        branch.branchName && branch.branchName.map((entry) => entry.value),
      branchShortName:
        branch.branchShortName &&
        branch.branchShortName.map((entry) => entry.value),
      openingHours:
        branch.openingHours && branch.openingHours.map((entry) => entry.value),
      illOrderReceiptText:
        branch.illOrderReceiptText &&
        branch.illOrderReceiptText.map((entry) => entry.value),
    };
  });
  return result;
}

export async function search(props, getFunc) {
  const {
    q,
    limit = 10,
    offset = 0,
    agencyid,
    language = "da",
    branchId,
    digitalAccessSubscriptions,
    infomediaSubscriptions,
  } = props;

  const age = lastUpdateMS ? new Date().getTime() - lastUpdateMS : 0;

  if (!branches || age > timeToLiveMS) {
    try {
      // Handle race condition
      // Avoid fetching branches at mulitple requests at a time
      if (fetchingPromise) {
        await fetchingPromise;
      } else {
        fetchingPromise = getFunc(props);
        branches = (await fetchingPromise).map((branch) => ({
          ...branch,
          id: branch.branchId,
          name: branch.branchName,
        }));

        if (excludeBranches) {
          branches = branches.filter(function (item) {
            return (
              digitalAccessSubscriptions[item.agencyId] ||
              infomediaSubscriptions[item.agencyId] ||
              item.pickupAllowed
            );
          });
        }

        branchesMap = {};
        branches.forEach((branch) => (branchesMap[branch.id] = branch));

        lastUpdateMS = new Date().getTime();
      }
    } finally {
      // Clean up promise
      fetchingPromise = null;
    }
  }

  let result = branches;

  if (q) {
    // prefix match
    result = index.search(q, branches, searchOptions);

    // If no match use fuzzy to find nearest match
    if (result.length === 0) {
      // try fuzzy  match
      result = index.search(q, branches, {
        ...searchOptions,
        fuzzy: 0.4,
      });
    }
  }

  // merged to return all fields.
  let merged = result.map((branch) => ({
    ...branch,
    ...branchesMap[branch.id],
  }));

  if (agencyid) {
    const stripped = agencyid.replace(/\D/g, "");
    merged = merged.filter((branch) => branch.agencyId === stripped);
  }
  if (branchId) {
    merged = merged.filter((branch) => branch.branchId === branchId);
  }
  merged = orderBy(merged, ["score", "branchId"], ["desc", "asc"]);
  merged = [
    ...merged.filter((branch) => branch.pickupAllowed),
    ...merged.filter((branch) => !branch.pickupAllowed),
  ];

  return {
    hitcount: merged.length,
    result: merged
      .slice(offset, limit)
      .map((branch) => ({ ...branch, language })),
  };
}

export async function load(props) {
  return search(props, get);
}
