/**
 * @file Make branches searchable using a tiny js inmemory search engine
 *
 * Note, this was implemented before changing to vip-core.
 * Some day we may use the findlibrary operation to do this, but for now
 * it does not support highlighting and "one field search"
 *
 */
import { orderBy } from "lodash";
import { log } from "dbc-node-logger";
import config from "../config";
import { createIndexer } from "../utils/searcher";
import { checkLoginIndependence } from "../utils/agency";
import { fetch } from "../utils/fetchWorker";

/**
 * The default fetch is used, when library search is invoked outside of the context of a graphql request.
 * For instance directly from the documentation website
 */
const defaultFetch = async (...args) => {
  const res = await fetch(...args);
  return {
    body: JSON.parse(Buffer.from(res.buffer).toString()),
  };
};

const { teamLabel } = config.datasources.vipcore;

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

function logLibraryEvent(level, event, details = {}) {
  log[level](`CREDENTIAL_LIBRARY_${event}`, details);
}

async function fetchWithLibraryLogging(fetchImpl, url, traceId, requestName) {
  const startedAt = performance.now();

  logLibraryEvent("info", "UPSTREAM_START", {
    traceId,
    requestName,
    url,
  });

  try {
    const response = await fetchImpl(url);

    logLibraryEvent("info", "UPSTREAM_SUCCESS", {
      traceId,
      requestName,
      url,
      durationMs: Math.round(performance.now() - startedAt),
      topLevelKeys:
        response?.body && typeof response.body === "object"
          ? Object.keys(response.body).slice(0, 8)
          : [],
    });

    return response;
  } catch (error) {
    logLibraryEvent("error", "UPSTREAM_FAILED", {
      traceId,
      requestName,
      url,
      durationMs: Math.round(performance.now() - startedAt),
      error: {
        name: error?.name || "Error",
        message: error?.message || String(error),
        code: error?.code || error?.cause?.code || null,
      },
    });
    throw error;
  }
}

/**
 * Get ALL libraries
 * @returns {Promise<*>}
 */
async function get(fetch = defaultFetch, traceId = null) {
  // This contain information with a different structure (but no agencySubdivision)
  const alllibrariesUrl = `${config.datasources.vipcore.url}/alllibraries`;

  // This contains mobileLibraryLocations (agencySubdivision) for bogbusser
  const findlibraryUrl = `${config.datasources.vipcore.url}/findlibrary/all`;

  // borrowerchecklist
  const borrowerchecklistUrl = `${config.datasources.vipcore.url}/borrowerchecklist/login.bib.dk/true`;

  logLibraryEvent("info", "GET_START", {
    traceId,
    alllibrariesUrl,
    findlibraryUrl,
    borrowerchecklistUrl,
  });

  const startedAt = performance.now();
  const [allLibrariesRes, findLibraryRes, borrowerChecklistRes] =
    await Promise.all([
      fetchWithLibraryLogging(
        fetch,
        alllibrariesUrl,
        traceId,
        "vipcore_alllibraries"
      ),
      fetchWithLibraryLogging(
        fetch,
        findlibraryUrl,
        traceId,
        "vipcore_findlibrary_all"
      ),
      fetchWithLibraryLogging(
        fetch,
        borrowerchecklistUrl,
        traceId,
        "vipcore_borrowerchecklist"
      ),
    ]);

  logLibraryEvent("info", "GET_SUCCESS", {
    traceId,
    durationMs: Math.round(performance.now() - startedAt),
    allLibrariesCount: allLibrariesRes.body?.allLibraries?.length || 0,
    pickupAgencyCount: findLibraryRes.body?.pickupAgency?.length || 0,
    borrowerCheckCount:
      borrowerChecklistRes.body?.borrowerCheckLibrary?.length || 0,
  });

  const res = [
    allLibrariesRes.body.allLibraries,
    findLibraryRes.body.pickupAgency,
    borrowerChecklistRes.body.borrowerCheckLibrary,
  ];

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
      // store original agencyId (Not manipulated)
      _agencyId: agencyId,
      mobileLibraryLocations: branchMap[branchId]?.agencySubdivision,
      openingHoursUrl:
        branchMap[branchId]?.openingHoursUrl ||
        branchMap[branchMap[branchId]?.agencyId]?.openingHoursUrl ||
        null,
      branchPhone: branchMap[branchId]?.branchPhone,
      branchEmail: branchMap[branchId]?.branchEmail,
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
async function doRequest(fetch = defaultFetch, traceId = null) {
  logLibraryEvent("info", "DO_REQUEST_START", {
    traceId,
  });

  const startedAt = performance.now();
  const libraries = await get(fetch, traceId);

  logLibraryEvent("info", "DO_REQUEST_SUCCESS", {
    traceId,
    durationMs: Math.round(performance.now() - startedAt),
    libraryCount: libraries?.length || 0,
  });

  return libraries.map((branch) => ({
    ...branch,
    agencyType: translatedAgencyType(branch.agencyType) || "ANDRE",
    illOrderReceiptText:
      branch.illOrderReceiptText &&
      branch.illOrderReceiptText.map((entry) => entry.value),
  }));
}

async function fetchIfOld(getFunc, fetch = defaultFetch, traceId = null) {
  logLibraryEvent("info", "CACHE_CHECK", {
    traceId,
    hasBranches: Boolean(branches),
    ageMs: age(),
    timeToLiveMS,
    hasFetchingPromise: Boolean(fetchingPromise),
  });

  if (!branches || age() > timeToLiveMS) {
    // if (true) {
    try {
      // Handle race condition
      // Avoid fetching branches at multiple requests at a time
      if (fetchingPromise) {
        logLibraryEvent("info", "CACHE_WAIT_EXISTING_FETCH_START", {
          traceId,
        });
        const waitStartedAt = performance.now();
        await fetchingPromise;
        logLibraryEvent("info", "CACHE_WAIT_EXISTING_FETCH_SUCCESS", {
          traceId,
          durationMs: Math.round(performance.now() - waitStartedAt),
        });
      } else {
        logLibraryEvent("info", "CACHE_REFRESH_START", {
          traceId,
        });
        const refreshStartedAt = performance.now();
        fetchingPromise = getFunc(fetch, traceId);
        branches = (await fetchingPromise).map((branch) => ({
          ...branch,
          id: branch.branchId,
        }));

        branchesMap = {};
        branches.forEach((branch) => (branchesMap[branch.id] = branch));

        lastUpdateMS = new Date().getTime();
        logLibraryEvent("info", "CACHE_REFRESH_SUCCESS", {
          traceId,
          durationMs: Math.round(performance.now() - refreshStartedAt),
          branchCount: branches.length,
        });
      }
    } finally {
      // Clean up promise
      logLibraryEvent("info", "CACHE_FETCH_CLEANUP", {
        traceId,
        hadFetchingPromise: Boolean(fetchingPromise),
      });
      fetchingPromise = null;
    }
  } else {
    logLibraryEvent("info", "CACHE_HIT", {
      traceId,
      branchCount: branches?.length || 0,
      ageMs: age(),
    });
  }
}
/**
 * Search on given query.
 * @param props
 * @param getFunc
 * @returns {Promise<{result: (*&{language: string})[], hitcount: number}>}
 */
export async function search(props, getFunc = doRequest, fetch = defaultFetch) {
  const traceId = props?.traceId || null;
  const {
    q,
    limit = 10,
    offset = 0,
    agencyid,
    branchId,
    digitalAccessSubscriptions = [],
    infomediaSubscriptions = [],
    status = "ALLE",
    statuses = ["ALLE"],
    agencyTypes = ["ALLE"],
    bibdkExcludeBranches,
    sortPickupAllowed = false,
  } = props;

  // ensure lowercased language prop
  const language = props?.language?.toLowerCase() || "da";

  logLibraryEvent("info", "SEARCH_START", {
    traceId,
    q: q || null,
    branchId: branchId || null,
    agencyid: agencyid || null,
    limit,
    offset,
  });

  const fetchStartedAt = performance.now();
  await fetchIfOld(getFunc, fetch, traceId);
  logLibraryEvent("info", "SEARCH_DATA_READY", {
    traceId,
    durationMs: Math.round(performance.now() - fetchStartedAt),
    branchCount: branches?.length || 0,
  });

  // filter on requested status
  const useAgencyTypesFilter = !agencyTypes.includes("ALLE");
  const useStatusFilter = status !== "ALLE";
  const useStatusesFilter = !statuses.includes("ALLE");

  const shouldFilter =
    bibdkExcludeBranches ||
    useStatusFilter ||
    useAgencyTypesFilter ||
    useStatusesFilter;

  // should given branch be included in result ?
  const filterAndExclude = (branch) => {
    let include = true;

    if (bibdkExcludeBranches) {
      include =
        digitalAccessSubscriptions[branch.agencyId] ||
        infomediaSubscriptions[branch.agencyId] ||
        branch.pickupAllowed;
    }

    // old status - one status only - deprecated
    if (include && useStatusFilter) {
      include = branch.status === translatedStatus(status);
    }
    // new statuses - an array of status - use this
    if (include && useStatusesFilter) {
      const translatedStatuses = statuses.map((stat) => translatedStatus(stat));
      include = translatedStatuses.includes(branch.status);
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
    if (result?.length === 0) {
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
  if (sortPickupAllowed) {
    merged = [
      ...merged.filter((branch) => branch.pickupAllowed),
      ...merged.filter((branch) => !branch.pickupAllowed),
    ];
  }

  const finalResult = {
    hitcount: merged.length,
    result: merged.slice(offset, limit + offset).map((branch) => ({
      ...branch,
      // translate agencyType from mocked library data
      agencyType: translatedAgencyType(branch?.agencyType),
      language,
    })),
  };

  logLibraryEvent("info", "SEARCH_SUCCESS", {
    traceId,
    hitcount: finalResult.hitcount,
    returnedCount: finalResult.result.length,
    branchId: branchId || null,
    agencyid: agencyid || null,
  });

  return finalResult;
}

export async function load(props, { getLoader }, context) {
  const traceId = props?.traceId || null;

  logLibraryEvent("info", "LOAD_START", {
    traceId,
    branchId: props?.branchId || null,
    agencyid: props?.agencyid || null,
    q: props?.q || null,
  });

  // We need to fetch digital access and infomedia subscriptions
  // for all agencies, in order to build the search index
  const digitalAccessSubscriptions = await getLoader(
    "statsbiblioteketSubscribers"
  ).load("");
  const infomediaSubscriptions = await getLoader("idp").load("");

  const res = await search(
    { ...props, digitalAccessSubscriptions, infomediaSubscriptions },
    doRequest,
    context?.fetch || defaultFetch
  );

  logLibraryEvent("info", "LOAD_SUCCESS", {
    traceId,
    hitcount: res?.hitcount || 0,
    returnedCount: res?.result?.length || 0,
    usedContextFetch: Boolean(context?.fetch),
  });

  return res;
}

export { teamLabel };
