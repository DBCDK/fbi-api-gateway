import config from "../config";
import isEmpty from "lodash/isEmpty";
import uniqBy from "lodash/uniqBy";
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

function compareDate(a, b) {
  return getFirstMatch(true, 0, [
    [!a && !b, 0],
    [a && !b, -1],
    [b && !a, 1],
    [a > b, 1],
    [a <= b, -1],
  ]);
}

function responseBuilderFactory(filter) {
  const agencyHoldingsTypes = Object.keys(AgencyHoldingsFilterEnum).reduce(
    (accumulator, currentValue) => {
      accumulator[currentValue] = [];
      return accumulator;
    },
    {}
  );

  return {
    ...agencyHoldingsTypes,
    agencyIds: new Set(),
    getAgencyIdsAsArray() {
      return Array.from(this.agencyIds);
    },
    addResponse(holdings, singleFilter) {
      if (
        filter.includes(singleFilter) &&
        singleFilter !== AgencyHoldingsFilterEnum.ERRORS
      ) {
        this[filter].push(
          ...holdings.filter((holding) => {
            return (
              !this.agencyIds.has(holding.agencyId) &&
              holding.availability === singleFilter
            );
          })
        );
        holdings.map(
          (holding) =>
            holding.availability === singleFilter &&
            this.agencyIds.add(holding.agencyId)
        );
      }
    },
    addErrors(errors) {
      filter.includes(AgencyHoldingsFilterEnum.ERRORS) &&
        this[AgencyHoldingsFilterEnum.ERRORS].push(...errors);
    },
    getFilteredResponses() {
      return Object.keys(agencyHoldingsTypes).flatMap(
        (singleType) => this[singleType]
      );
    },
    getCount() {
      return this.getFilteredResponses().length;
    },
    getCountOfUniqueAgencyIds() {
      return uniqBy(this.getFilteredResponses(), "agencyId").length;
    },
  };
}

function checkSingleAvailability(item) {
  if (
    new Date(item.expectedDelivery).toDateString() === new Date().toDateString()
  ) {
    return AgencyHoldingsFilterEnum.AVAILABLE_NOW;
  }

  if (
    item.expectedDelivery &&
    !isEmpty(item.expectedDelivery) &&
    new Date(item.expectedDelivery).toDateString() !== new Date().toDateString()
  ) {
    return AgencyHoldingsFilterEnum.AVAILABLE_LATER;
  }

  if (!item.expectedDelivery || isEmpty(item.expectedDelivery)) {
    return AgencyHoldingsFilterEnum.AVAILABLE_UNKNOWN;
  }
}

function checkAvailability(singleRes) {
  return singleRes.holdingsItem
    .map((item) => checkSingleAvailability(item))
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

function parseDetailedHoldingsResponse(responseBody) {
  const results = responseBody?.responderDetailed?.map((res) => {
    return {
      ...res,
      agencyId: res.responderId,
      expectedDelivery: res.holdingsItem
        ?.map((e) => e.expectedDelivery)
        ?.sort(compareDate)?.[0],
      availability: checkAvailability(res),
      holdingsItem: res.holdingsItem.map((singleHoldingsItem) => {
        return {
          ...singleHoldingsItem,
          pid: res.pid,
          availability: checkSingleAvailability(singleHoldingsItem),
        };
      }),
      errorMessage: null,
    };
  });

  const errors = responseBody?.error?.map((singleError) => {
    return {
      ...singleError,
      agencyId: singleError.responderId,
      availability: AgencyHoldingsFilterEnum.ERRORS,
      holdingsItem: [],
    };
  });

  return {
    results: results,
    errors: errors,
  };
}

function queryForDetailedHoldings(agencyIds, pids) {
  if (!agencyIds || isEmpty(agencyIds) || !pids || isEmpty(pids)) {
    return [];
  } else {
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
  const responseBuilder = responseBuilderFactory(filter);

  let currentOffset = 0;
  let numberOfCallsToService = 0;

  // We need to adjust these during running for performance reasons
  let lookupRecord = lookupRecordBeforeSetup;
  let stepSize = stepSizeBeforeSetup;

  do {
    // PERFORMANCE - `lookupRecord` is adjusted by removing records wuth agencyIds found in `responseBuilder.agencyIds` and `responseBuilder.results`
    lookupRecord = lookupRecord.filter((singleLookupRecord) => {
      return !responseBuilder.agencyIds.has(singleLookupRecord.responderId);
    });

    const currentLookupRecord = lookupRecord.slice(0, stepSize);
    lookupRecord = lookupRecord.slice(stepSize, lookupRecord.length);
    //

    const tempRes = await fetchDetailedHoldings(context, currentLookupRecord);

    const {
      results: holdings,
      errors: errorsFromResponse,
    } = parseDetailedHoldingsResponse(tempRes.body);

    [
      AgencyHoldingsFilterEnum.AVAILABLE_NOW,
      AgencyHoldingsFilterEnum.AVAILABLE_LATER,
      AgencyHoldingsFilterEnum.AVAILABLE_UNKNOWN,
    ].map((singleFilter) =>
      responseBuilder.addResponse(holdings, singleFilter)
    );

    responseBuilder.addErrors(errorsFromResponse);

    currentOffset += stepSize;
    numberOfCallsToService += 1;

    // PERFORMANCE - `stepSize` is adjusted as results are found to reduce the size of the calls to service
    stepSize = Math.ceil(
      Math.max(
        10,
        Math.min(stepSize, (resultCount - responseBuilder.agencyIds.size) * 10)
      )
    );
    //
  } while (
    !(
      numberOfCallsToService > lookupRecord.length ||
      responseBuilder.getCountOfUniqueAgencyIds() >= resultCount ||
      currentOffset >= lookupRecordBeforeSetup.length
    )
  );

  return {
    responses: responseBuilder.getFilteredResponses(),
    countUniqueAgencies: responseBuilder.getCountOfUniqueAgencyIds(),
    countUniqueResponses: responseBuilder.getCount(),
    agencyIdsWithResults: responseBuilder.getAgencyIdsAsArray(),
    numberOfCallsToService: numberOfCallsToService,
  };
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

  const {
    responses,
    agencyIdsWithResults,
    countUniqueResponses,
    countUniqueAgencies,
    numberOfCallsToService,
  } = await progressiveLoad({
    context: context,
    lookupRecord: lookupRecord,
    resultCount: resultCount,
    filter: filter,
  });

  return {
    countUniqueResponses: countUniqueResponses,
    countUniqueAgencies: countUniqueAgencies,
    agencyIds: agencyIdsWithResults,
    agencyHoldings: responses,
    numberOfCallsToService: numberOfCallsToService,
  };
}

export const options = {
  redis: {
    prefix: holdingsServicePrefix,
    ttl: holdingsServiceTtl,
  },
};
