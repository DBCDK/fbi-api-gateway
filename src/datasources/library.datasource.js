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
import { checkLoginIndependence } from "../utils/agency";

const fields = [
  "name",
  "agencyName",
  "agencyNames",
  "agencyId",
  "_agencyId",
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
      .replace("kgl.", "kongelige")
      .replace("kgl", "kongelige")
      .replace(/æ/g, "ae")
      .replace(/ø/g, "oe")
      .replace(/å/g, "aa")
      .replace(/[\.|\,]/g, ""),
};

// Default search options
const searchOptions = {
  boost: { agencyName: 10000 },
  //TODO: fine tune later?
  // boost: {
  //   // names
  //   name: 75,
  //   city: 100,
  //   agencyNames: 50, // only field set before, to a value of 1000
  //   // numbers
  //   postalCode: 100,
  //   branchId: 50,
  //   agencyId: 25,
  // },
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
  // This contain information with a different structure (but no agencySubdivision)
  const alllibrariesUrl = `${config.datasources.vipcore.url}/alllibraries`;

  // This contains mobileLibraryLocations (agencySubdivision) for bogbusser
  const findlibraryUrl = `${config.datasources.vipcore.url}/findlibrary/all`;

  // borrowerchecklist
  const borrowerchecklistUrl = `${config.datasources.vipcore.url}/borrowerchecklist/login.bib.dk/true`;

  // Fetch in parallel
  const res = await Promise.all([
    (await request.get(alllibrariesUrl)).body.allLibraries,
    (await request.get(findlibraryUrl)).body.pickupAgency,
    (await request.get(borrowerchecklistUrl)).body.borrowerCheckLibrary,
  ]);

  // Make a map for fast branchId->branch lookups
  const branchMap = {};
  res[1]?.forEach((branch) => (branchMap[branch.branchId] = branch));

  // Make a map for
  const borchkMap = {};
  res[2].forEach((obj) => (borchkMap[obj.loginAgencyId] = obj));

  // Merge mobileLibraryLocations into result
  const branches = res[0]?.map((branch) => {
    const { branchId, agencyId } = branch;

    const isIndependent = checkLoginIndependence(branch, borchkMap);

    return {
      ...branch,
      agencyId: isIndependent ? branchId : agencyId,
      _agencyId: isIndependent ? agencyId : null,
      mobileLibraryLocations: branchMap[branchId]?.agencySubdivision,
    };
  });

  return branches;
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

  // return translated enum or enum if already translated
  return obj[enumType] || enumType?.toUpperCase();
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

async function fetchIfOld(getFunc) {
  if (!branches || age() > timeToLiveMS) {
    // if (true) {
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
}
/**
 * Search on given query.
 * @param props
 * @param getFunc
 * @returns {Promise<{result: (*&{language: string})[], hitcount: number}>}
 */
export async function search(props, getFunc = doRequest) {
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

  await fetchIfOld(getFunc);

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
      // .toUpperCase() added for mocked test libraries support
      include = agencyTypes.includes(branch?.agencyType?.toUpperCase());
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
  if (branchId) {
    result = [branchesMap[branchId]].filter((branch) => !!branch);
    if (shouldFilter) {
      result = result.filter(filterAndExclude);
    }
  }
  if (agencyid) {
    const stripped = agencyid.replace(/\D/g, "");
    result = result.filter((branch) => branch.agencyId === stripped);
    if (shouldFilter) {
      result = result.filter(filterAndExclude);
    }
  }

  // merged to return all fields.
  let merged = result.map((branch) => ({
    ...branch,
    ...branchesMap[branch.id],
  }));

  merged = q
    ? orderBy(merged, ["score", "branchId"], ["desc", "asc"])
    : orderBy(merged, ["name"], ["asc"]);

  // Disabled this sort for now - see if login result gets better
  // sort by pickupAllowed AFTER sorting by score/branchId or name
  merged = [
    ...merged.filter((branch) => branch.pickupAllowed),
    ...merged.filter((branch) => !branch.pickupAllowed),
  ];
  return {
    hitcount: merged.length,
    result: merged.slice(offset, limit + offset).map((branch) => ({
      ...branch,
      // translate agencyType from mocked library data
      agencyType: translatedAgencyType(branch?.agencyType),
      language,
    })),
  };
}

export async function load(props, { getLoader }) {
  // We need to fetch digital access and infomedia subscriptions
  // for all agencies, in order to build the search index
  const digitalAccessSubscriptions = await getLoader(
    "statsbiblioteketSubscribers"
  ).load("");
  const infomediaSubscriptions = await getLoader("idp").load("");

  const res = await search(
    { ...props, digitalAccessSubscriptions, infomediaSubscriptions },
    doRequest
  );

  return res;
}
