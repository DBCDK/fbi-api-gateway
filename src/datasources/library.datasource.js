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

const fields = [
  "name",
  "agencyName",
  "agencyNames",
  "agencyId",
  "branchId",
  "city",
  "postalCode",
];

const storeFields = [
  ...fields,
  "libraryStatus",
  "pickupAllowed",
  "status",
  "agencyType",
];

// Indexer options
const options = {
  fields, // fields to index for full-text search
  storeFields,
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

// We cache the docs for 30 minutes
let branches;
let branchesMap;
let lastUpdateMS;
let fetchingPromise;
const index = createIndexer({ options });
const timeToLiveMS = 1000 * 60 * 30;

/**
 * Get ALL libraries
 * @returns {Promise<*>}
 */
async function get() {
  const url = config.datasources.libarysearch.url;
  return (await request.get(url)).body.allLibraries;
}

/**
 * Time to cache libraries
 * @returns {number|number}
 */
const age = () => {
  return lastUpdateMS ? new Date().getTime() - lastUpdateMS : 0;
};

// We need to translate agencyType enum to not brake api
const translatedAgencyType = (enumType) => {
  const obj = {
    Skolebibliotek: "SKOLEBIBLIOTEK",
    Folkebibliotek: "FOLKEBIBLIOTEK",
    Forskningsbibliotek: "FORSKNINGSBIBLIOTEK",
    Other: "ANDRE",
  };

  return obj[enumType];
};

// filter function to be used in all cases
// We need to translate status enum to not brake api
// @TODO whatabout 'internal' ??
const translatedStatus = (enumStatus) => {
  const trans = {
    SLETTET: "deleted",
    AKTIVE: "active",
    USYNLIG: "invisible",
  };

  return trans[enumStatus];
};

/**
 * Do request(s) - we do several requests to get hold of all libraries (active, deleted, invisible)
 * and set a library status to filter on.
 *
 * @returns {Promise<(*&{branchShortName, branchName, openingHours, illOrderReceiptText})[]>}
 */
async function doRequest() {
  const libraries = await get();
  return libraries.map((branch) => ({
    ...branch,
    agencyType: translatedAgencyType(branch.agencyType) || "ANDRE",
    illOrderReceiptText:
      branch.illOrderReceiptText &&
      branch.illOrderReceiptText.map((entry) => entry.value),
  }));
}

/**
 * Search on given query.
 * @param props
 * @param getFunc
 * @returns {Promise<{result: (*&{language: string})[], hitcount: number}>}
 */
export async function search(props, getFunc) {
  const {
    q,
    limit = 10,
    offset = 0,
    agencyid,
    language = "da",
    branchId,
    digitalAccessSubscriptions = [],
    infomediaSubscriptions = [],
    status = "ALLE",
    agencyTypes = ["ALLE"],
    bibdkExcludeBranches,
  } = props;

  if (!branches || age() > timeToLiveMS) {
    //if (true) {
    try {
      // Handle race condition
      // Avoid fetching branches at multiple requests at a time
      if (fetchingPromise) {
        await fetchingPromise;
      } else {
        fetchingPromise = getFunc();
        branches = (await fetchingPromise).map((branch) => ({
          ...branch,
          id: branch.branchId,
        }));

        branchesMap = {};
        branches.forEach((branch) => (branchesMap[branch.id] = branch));

        lastUpdateMS = new Date().getTime();
      }
    } finally {
      // Clean up promise
      fetchingPromise = null;
    }
  }

  // filter on requested status
  const useAgencyTypesFilter = !agencyTypes.includes("ALLE");
  const useStatusFilter = status !== "ALLE";

  const shouldFilter =
    bibdkExcludeBranches || useStatusFilter || useAgencyTypesFilter;

  const filterAndExclude = (branch) => {
    let include = true;

    if (bibdkExcludeBranches) {
      include =
        digitalAccessSubscriptions[branch.agencyId] ||
        infomediaSubscriptions[branch.agencyId] ||
        branch.pickupAllowed;
    }

    if (include && useStatusFilter) {
      include = branch.status === translatedStatus(status);
    }

    if (include && useAgencyTypesFilter) {
      include = agencyTypes.includes(branch.agencyType);
    }

    return include;
  };

  let result = branches;

  if (q) {
    // query given
    // prefix match
    result = index.search(q, branches, {
      ...searchOptions,
      ...(shouldFilter && { filter: filterAndExclude }),
    });

    // If no match use fuzzy to find the nearest match
    if (result.length === 0) {
      // try fuzzy  match
      result = index.search(q, branches, {
        ...searchOptions,
        ...(shouldFilter && { filter: filterAndExclude }),
        fuzzy: 0.4,
      });
    }
  }

  // no query given - result is all branches - filter if requested
  else if (shouldFilter) {
    result = result.filter(filterAndExclude);
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

  merged = q
    ? orderBy(merged, ["score", "branchId"], ["desc", "asc"])
    : orderBy(merged, ["name"], ["asc"]);

  // sort by pickupAllowed AFTER sorting by score/branchId or name
  merged = [
    ...merged.filter((branch) => branch.pickupAllowed),
    ...merged.filter((branch) => !branch.pickupAllowed),
  ];

  return {
    hitcount: merged.length,
    result: merged
      .slice(offset, limit + offset)
      .map((branch) => ({ ...branch, language })),
  };
}

export async function load(props, { getLoader }) {
  // We need to fetch digital access and infomedia subscriptions
  // for all agencies, in order to build the search index
  const digitalAccessSubscriptions = await getLoader(
    "statsbiblioteketSubscribers"
  ).load("");
  const infomediaSubscriptions = await getLoader("idp").load("");

  return search(
    { ...props, digitalAccessSubscriptions, infomediaSubscriptions },
    doRequest
  );
}
