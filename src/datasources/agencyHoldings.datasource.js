import config from "../config";
import isEmpty from "lodash/isEmpty";
import { getFirstMatch } from "../utils/utils";

const {
  url: holdingsServiceUrl,
  prefix: holdingsServicePrefix,
  ttl: holdingsServiceTtl,
} = config.datasources.holdingsservice;

/**
 * @typedef {("AVAILABLE_NOW"|"AVAILABLE_LATER"|"AVAILABLE_UNKNOWN"|"ERRORS")} AgencyHoldingsFilterType
 * @type {Readonly<{AVAILABLE_NOW: string, AVAILABLE_LATER: string, AVAILABLE_UNKNOWN: string, ERRORS: string}>}
 */
// Equivalent use in schema
export const AgencyHoldingsFilterEnum = Object.freeze({
  AVAILABLE_NOW: "AVAILABLE_NOW",
  AVAILABLE_LATER: "AVAILABLE_LATER",
  AVAILABLE_UNKNOWN: "AVAILABLE_UNKNOWN",
  ERRORS: "ERRORS",
});

function checkSingleAvailability(expectedDelivery) {
  return getFirstMatch(true, AgencyHoldingsFilterEnum.AVAILABLE_UNKNOWN, [
    [
      new Date(expectedDelivery).toDateString() === new Date().toDateString(),
      AgencyHoldingsFilterEnum.AVAILABLE_NOW,
    ],
    [
      expectedDelivery &&
        !isEmpty(expectedDelivery) &&
        new Date(expectedDelivery).toDateString() !== new Date().toDateString(),
      AgencyHoldingsFilterEnum.AVAILABLE_LATER,
    ],
  ]);
}

function checkAvailability(singleRes) {
  return singleRes.holdingsItem
    .map((item) => checkSingleAvailability(item.expectedDelivery))
    ?.sort((a, b) => {
      function getMatcherArray(matcherValue) {
        return [
          [matcherValue === AgencyHoldingsFilterEnum.AVAILABLE_NOW, 0],
          [matcherValue === AgencyHoldingsFilterEnum.AVAILABLE_LATER, 1],
          [matcherValue === AgencyHoldingsFilterEnum.AVAILABLE_UNKNOWN, 2],
        ];
      }
      const aValue = getFirstMatch(
        true,
        getMatcherArray(a).length,
        getMatcherArray(a)
      );
      const bValue = getFirstMatch(
        true,
        getMatcherArray(b).length,
        getMatcherArray(b)
      );

      return aValue - bValue;
    })?.[0];
}

function parseDetailedHoldingsResponse(responderDetailed) {
  return responderDetailed?.map((res) => {
    return {
      agencyId: res.responderId,
      availability: checkAvailability(res),
    };
  });
}

async function fetchDetailedHoldings(context, lookupRecord) {
  if (isEmpty(lookupRecord)) {
    return {
      body: { responderDetailed: [], error: [], trackingId: "betabib" },
    };
  }

  return await context.fetch(`${holdingsServiceUrl}detailed-holdings`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lookupRecord: lookupRecord,
      trackingId: "betabib",
    }),
  });
}

async function progressiveLoad({
  context,
  resultCount = 10,
  stepSizeBeforeSetup = resultCount + Math.ceil(resultCount * 0.25),
  lookupRecord: lookupRecordBeforeSetup,
  filter,
}) {
  const lookupRecordBeforeSetupLength = lookupRecordBeforeSetup.length;
  const agencyIdsWithFilteredHoldings = new Set();

  // PERFORMANCE - We need to adjust these during running for performance reasons, therefore `let` and not `const`
  let currentOffset = 0;
  let numberOfCallsToService = 0;
  let lookupRecord = lookupRecordBeforeSetup;
  let stepSize = stepSizeBeforeSetup;
  // ---

  do {
    // PERFORMANCE - `lookupRecord` is adjusted by removing records with agencyIds
    //  found in `responseBuilder.agencyIds` and `responseBuilder.results`
    lookupRecord = lookupRecord.filter(
      (singleLookupRecord) =>
        !agencyIdsWithFilteredHoldings.has(singleLookupRecord.responderId)
    );

    const currentLookupRecord = lookupRecord.slice(0, stepSize);
    lookupRecord = lookupRecord.slice(stepSize, lookupRecord.length);
    // ---

    const tempRes = await fetchDetailedHoldings(context, currentLookupRecord);

    const holdings = parseDetailedHoldingsResponse(
      tempRes.body.responderDetailed
    );

    [
      AgencyHoldingsFilterEnum.AVAILABLE_NOW,
      AgencyHoldingsFilterEnum.AVAILABLE_LATER,
      AgencyHoldingsFilterEnum.AVAILABLE_UNKNOWN,
    ].map((singleFilter) => {
      holdings.map((holding) => {
        if (
          filter.includes(singleFilter) &&
          singleFilter !== AgencyHoldingsFilterEnum.ERRORS &&
          holding.availability === singleFilter
        ) {
          agencyIdsWithFilteredHoldings.add(holding.agencyId);
        }
      });
    });

    currentOffset += stepSize;
    numberOfCallsToService += 1;

    // PERFORMANCE - `stepSize` is adjusted as results are found to reduce the size of the calls to service
    stepSize = Math.ceil(
      Math.max(
        10,
        Math.min(
          stepSize,
          (resultCount - agencyIdsWithFilteredHoldings.size) * 10
        )
      )
    );
    // ---
  } while (
    !(
      agencyIdsWithFilteredHoldings.size >= resultCount ||
      currentOffset >= lookupRecordBeforeSetupLength
    )
  );

  const agencyIdsAsArray = Array.from(agencyIdsWithFilteredHoldings);

  return {
    countUniqueAgencies: agencyIdsAsArray.length,
    agencyIdsWithResults: agencyIdsAsArray,
    numberOfCallsToService: numberOfCallsToService,
  };
}

function queryForDetailedHoldings(agencyIds, pids) {
  // PERFORMANCE - We create lookupRecord such that we look at 1 pid for every agencyId first (because most popular pids,
  //  are first in the list of pids. We do this rather than looking at every pid for 1 agencyId,
  //  because this means worst case more often
  if (!agencyIds || isEmpty(agencyIds) || !pids || isEmpty(pids)) {
    return [];
  } else {
    // Fast version: pid > agencyId
    return pids.reduce(
      (accumulator, pid) => [
        ...accumulator,
        ...agencyIds.map((agencyId) => {
          return {
            pid: pid,
            responderId: agencyId,
          };
        }),
      ],
      []
    );
  }
}

/**
 *
 * @param {string[]} agencyIds
 * @param {string[]} pids
 * @param {number} resultCountBeforeCheck
 * @param {AgencyHoldingsFilterType[]} filterBeforeCheck
 * @param context
 * @returns {Promise<{agencyHoldings: *, countUniqueAgencies: *, countUniqueResponses: *, numberOfCallsToService: number}>}
 */
export async function load(
  {
    agencyIds,
    pids,
    resultCount: resultCountBeforeCheck,
    filter: filterBeforeCheck,
  },
  context
) {
  const resultCount = Math.min(agencyIds.length, resultCountBeforeCheck ?? 10);

  const filter =
    !filterBeforeCheck || filterBeforeCheck.length === 0
      ? [AgencyHoldingsFilterEnum.AVAILABLE_NOW]
      : filterBeforeCheck;

  const lookupRecord = queryForDetailedHoldings(agencyIds, pids);

  // PERFORMANCE - We do a progressive load to reduce pressure on server and decrease call time
  const {
    agencyIdsWithResults,
    countUniqueAgencies,
    numberOfCallsToService,
  } = await progressiveLoad({
    context: context,
    lookupRecord: lookupRecord,
    resultCount: resultCount,
    filter: filter,
  });
  // ---

  return {
    countUniqueAgencies: countUniqueAgencies,
    agencyIds: agencyIdsWithResults,
    numberOfCallsToService: numberOfCallsToService,
  };
}

export const options = {
  redis: {
    prefix: holdingsServicePrefix,
    ttl: holdingsServiceTtl,
  },
};
