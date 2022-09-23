/**
 * @file Make branches searchable using a tiny js inmemory search engine
 *
 * Note, this was implemented before changing to vip-core.
 * Some day we may use the findlibrary operation to do this, but for now
 * it does not support highlighting and "one field search"
 *
 */
import { orderBy, uniqBy } from "lodash";
import request from "superagent";
import config from "../config";
import { createIndexer } from "../utils/searcher";

// this endpoint is not in use right now. wait for fbiscrum to
// fix vip-core.
const endpoint = "/findlibrary/all?trackingId=betabib";

const fields = [
  "name",
  "agencyName",
  "agencyId",
  "branchId",
  "city",
  "postalCode",
];

const storeFields = [...fields, "libraryStatus"];

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

/**
 * Not in use at the moment - a bug in vip-core. To get libraries to
 * show in bibliotek.dk use libraryStatus="AKTIVE"
 * @returns {Promise<*>}
 */
async function get() {
  const url = config.datasources.vipcore.url + endpoint;
  const result = (await request.get(url)).body.pickupAgency;

  return result;
}

/**
 * Do a post with given library status
 * @param status
 * @returns {Promise<*>}
 */
async function post(status) {
  const url =
    config.datasources.vipcore.url + "/findlibrary?trackingId=betabib";
  return (
    await request.post(url).send({
      libraryStatus: status,
    })
  ).body.pickupAgency;
}

/**
 * Time to cache libraries
 * @returns {number|number}
 */
const age = () => {
  return lastUpdateMS ? new Date().getTime() - lastUpdateMS : 0;
};

/**
 * Do request(s) - we do several requests to get hold of all libraries (active, deleted, invisible)
 * and set a library status to filter on.
 *
 * @returns {Promise<(*&{branchShortName, branchName, openingHours, illOrderReceiptText})[]>}
 */
async function doRequest() {
  let result;

  // get active libraries first (librarStatus:"AKTIVE")
  const active = await post("AKTIVE");
  // set active status on active libraries
  active.forEach((del) => (del.libraryStatus = "AKTIVE"));
  // now get deleted libraries (libraryStatus: "SLETTET")
  const deleted = await post("SLETTET");
  // set deleted status on deleted libraries
  deleted.forEach((del) => (del.libraryStatus = "SLETTET"));
  // now get invisible libraries (libraryStatus:"USYNLIG")
  // invisible libraries are also included in active
  const invisible = await post("USYNLIG");
  // set invisible status on invisible libraries
  invisible.forEach((del) => (del.libraryStatus = "USYNLIG"));
  // merge arrays to get ALL libraries with libraryStatus set on relevant ones
  const alllibrarieswithstatus = [...invisible, ...active, ...deleted];
  // filter out duplicates
  const uniqueLibraries = uniqBy(alllibrarieswithstatus, "branchId");

  result = uniqueLibraries.map((branch) => {
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
    digitalAccessSubscriptions,
    infomediaSubscriptions,
    status = "AKTIVE",
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

  // filter on requested status
  const filterMe =
    status !== "ALLE" ? (branch) => branch.libraryStatus === status : null;

  let result = branches;

  if (q) {
    // prefix match
    result = index.search(q, branches, {
      ...searchOptions,
      ...(filterMe && { filter: filterMe }),
    });

    // If no match use fuzzy to find the nearest match
    if (result.length === 0) {
      // try fuzzy  match
      result = index.search(q, branches, {
        ...searchOptions,
        ...(filterMe && { filter: filterMe }),
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
  return search(props, doRequest);
}
