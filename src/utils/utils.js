import { graphql } from "graphql";
import { getExecutableSchema } from "../schemaLoader";
import { assign, get, intersectionWith, sortBy, uniq } from "lodash";
import { log } from "dbc-node-logger";
import { isFFUAgency } from "./agency";

export async function performTestQuery({
  query,
  variables,
  context,
  clientPermissions = { admin: true },
}) {
  return graphql(
    await getExecutableSchema({
      loadExternal: false,
      clientPermissions,
      hasAccessToken: !!context.accessToken,
    }),
    query,
    null,
    { ...context, profile: { agency: "123456", name: "some-profile" } },
    variables
  );
}

/**
 * Gets array at a path in some object
 * If value at path does not exists we return empty array
 * if value at path is not an array, we wrap in array
 *
 * @param {object} obj The object to look in
 * @param {string} path The path to look at
 *
 * @returns {array}
 */
export function getArray(obj, path) {
  const res = get(obj, path);
  if (res) {
    if (Array.isArray(res)) {
      return res;
    }
    return [res];
  }
  return [];
}

const regex = /\d{4}/g;

export function matchYear(str) {
  return str.match(regex);
}

// Extend every serie in the series array with extra fields
// These are resolved here because of the need of the correct workId
// resolvers include ReadThisFirst, readThisWhenever og numberInSeries

// we need to export this function to write a unit test
export function resolveSeries(data, parent) {
  const workId = parent?.workId;

  if (!workId) {
    return [];
  }

  return (
    data?.series?.map((serie) => {
      const match = serie.works?.find(
        ({ persistentWorkId }) => persistentWorkId === workId
      );

      // Select from specific member and add to series level
      const readThisFirst = match?.readThisFirst || null;
      const readThisWhenever = match?.readThisWhenever || null;
      const numberInSeries = match?.numberInSeries || null;

      return {
        numberInSeries,
        readThisFirst,
        readThisWhenever,
        ...serie,
      };
    }) || []
  );
}

/**
 * Generates the work page description
 * @param {object} work The work
 * @returns {string}
 */
export function getPageDescription({ title, creators, materialTypes }) {
  const creator = creators[0] && creators[0].name;
  const allowedTypes = ["lydbog", "e-bog", "bog"];
  const types = uniq(
    materialTypes
      .map((entry) => {
        for (let i = 0; i < allowedTypes.length; i++) {
          if (entry.materialType.toLowerCase().includes(allowedTypes[i])) {
            return allowedTypes[i];
          }
        }
      })
      .filter((type) => !!type)
  );

  let typesString = "";
  types.forEach((type, idx) => {
    if (idx > 0) {
      if (idx === types.length - 1) {
        // last element
        typesString += " eller ";
      } else {
        // middle element
        typesString += ", ";
      }
    } else {
      // first element
      typesString = " som ";
    }
    typesString += type;
  });

  return `Lån ${title}${
    creator ? ` af ${creator}` : ""
  }${typesString}. Bestil, reserver, lån fra alle danmarks biblioteker. Afhent på dit lokale bibliotek eller find online.`;
}

/**
 * Get files recursively
 * @param {string} dir
 * @param {array} result
 */
export function getFilesRecursive(dir, result = []) {
  // list files in directory and loop through
  require("fs")
    .readdirSync(dir)
    .forEach((file) => {
      // builds full path of file
      const fPath = require("path").resolve(dir, file);

      // prepare stats obj
      const fileStats = { file, path: fPath };

      // if its a folder, we get files from that
      if (require("fs").statSync(fPath).isDirectory()) {
        return getFilesRecursive(fPath, result);
      }

      result.push(fileStats);
    });
  return result;
}

/**
 * Example:
 *
 * getBaseUrl("https://fjernleje.filmstriben.dk/some-movie");
 * yields: "fjernleje.filmstriben.dk"
 *
 * @param {string} url
 * @returns {string}
 */
export function getBaseUrl(url) {
  if (!url) {
    return "";
  }
  const match = url.match(/(http|https):\/\/(www\.)?(.*?\..*?)(\/|\?|$)/i);
  if (match) {
    return match[3];
  }
  return url;
}

/**
 * Extracts details from a infomedia article
 *
 * @param {string} article
 * @returns {object}
 */
export function getInfomediaDetails(article) {
  const html = article.html;

  // Get all divs in article
  const div_regex = /<div([\s\S\n]*?)<\/div>/g;
  const divs = html.match(div_regex);

  const details = { html };
  divs.forEach((div) => {
    // extract div classNames (used for object keys)
    const class_regex = /class=\"(.*?)\"/;
    const className = div.match(class_regex)[1];

    // Strip classNames to proper keynames
    const name = className.replace("infomedia_", "");
    const key = name.charAt(0).toLowerCase() + name.slice(1);

    // Strip div tags from content
    const strip_regex = /<[\/]{0,1}(div)[^><]*>/g;
    const content = div.replace(strip_regex, "");

    // Set content with new keyname (from className)
    details[key] = content;
  });

  return details;
}

/**
 * Get agency parameters from vip core - check if settings allows borrowercheck
 * for given branch/agency.
 * @param agencyId
 *  can either be agency- or branchId depending ..
 * @param context
 * @returns {Promise<boolean>}
 */
export async function resolveBorrowerCheck(agencyId, context) {
  // returns true if login.bib.dk is supported
  if (!agencyId || !agencyId?.startsWith("7")) {
    return false;
  }
  const res = await context.datasources
    .getLoader("vipcore_UserOrderParameters")
    .load(agencyId);

  if (res?.agencyParameters?.borrowerCheckParameters) {
    return !!res.agencyParameters.borrowerCheckParameters.find(
      ({ borrowerCheckSystem, borrowerCheck }) =>
        borrowerCheckSystem === "login.bib.dk" && borrowerCheck
    );
  }
  return false;
}

/**
 * Get the infomedia access status for the current user
 *
 * @param {*} context
 * @returns {string}
 */
export async function getInfomediaAccessStatus(context) {
  const user = context?.user;

  if (!user?.userId) {
    return "USER_NOT_LOGGED_IN";
  }

  const municipalityAgencyId = user?.municipalityAgencyId;

  const infomediaSubscriptions = await context.datasources
    .getLoader("idp")
    .load("");

  const isSubscribed = infomediaSubscriptions[municipalityAgencyId];

  if (!isSubscribed) {
    return "MUNICIPALITY_NOT_SUBSCRIBED";
  }

  return "OK";
}

/**
 * Get the infomedia access status for the current user
 *
 * @param {*} context
 * @returns {string}
 */
export async function getDigitalArticleAccessStatus(context) {
  const user = context?.user;

  if (!user?.userId) {
    return "USER_NOT_LOGGED_IN";
  }

  const municipalityAgencyId = user?.municipalityAgencyId;

  const digitalArticleSubscriptions = await context.datasources
    .getLoader("statsbiblioteketSubscribers")
    .load("");

  const isSubscribed = digitalArticleSubscriptions[municipalityAgencyId];

  if (!isSubscribed) {
    return "MUNICIPALITY_NOT_SUBSCRIBED";
  }

  return "OK";
}

export async function resolveWork(args, context) {
  let id;
  if (args.id) {
    if (!validateWorkId(args.id)) {
      return null;
    }
    id = args.id;
  } else if (args.faust) {
    id = await context.datasources
      .getLoader("faustToWorkId")
      .load({ faust: args.faust, profile: context.profile });
  } else if (args.pid) {
    // get the owner workId from pid
    id = await context.datasources
      .getLoader("pidToWorkId")
      .load({ pid: args.pid, profile: context.profile });
    // get ownerwork from worldcat id .. via pidtowork
  } else if (args.oclc) {
    const pid = await context.datasources
      .getLoader("oclcNumberToPid")
      .load({ oclc: args.oclc });
    id = await context.datasources
      .getLoader("pidToWorkId")
      .load({ pid: pid, profile: context.profile });
  }
  if (!id) {
    return null;
  }

  const w = await context.datasources.getLoader("jedRecord").load({
    id,
    profile: context.profile,
  });

  return w;
}

/**
 * simple validator for workId
 * @param id
 * @returns {*}
 */
function validateWorkId(id) {
  return id.startsWith("work-of");
}

export async function resolveManifestation(args, context) {
  let pid;
  if (args.pid) {
    pid = args.pid;
  } else if (args.faust) {
    pid = await context.datasources
      .getLoader("faustToPid")
      .load({ faust: args.faust, profile: context.profile });
  }
  if (!pid) {
    return null;
  }

  const m = await context.datasources.getLoader("jedRecord").load({
    id: pid,
    profile: context.profile,
  });

  if (!m) {
    return null;
  }

  return m;
}

/**
 * Take Jed subjects object, and returns FBI-API list of subjects
 */
export function parseJedSubjects({
  corporations = [],
  persons = [],
  subjects = [],
  timePeriods = [],
  moods = [],
  narrativeTechniques = [],
  settings = [],
} = {}) {
  return [
    ...subjects.map((subject) => ({
      ...subject,
      __typename: "SubjectText",
    })),
    ...persons.map((person) => ({
      ...person,
      __typename: "Person",
    })),
    ...corporations.map((corporation) => ({
      ...corporation,
      __typename: "Corporation",
    })),
    ...timePeriods.map((timePeriod) => {
      // JED TIME_PERIOD backwards compatibility
      const shouldHavePeriod = timePeriod?.begin && timePeriod?.end;
      const begin = timePeriod.begin;
      const end = timePeriod.end;
      const period = { begin, end, display: `${begin}-${end}` };

      return {
        ...timePeriod,
        period: shouldHavePeriod ? period : null,
        __typename: "TimePeriod",
      };
    }),
    ...moods.map((moods) => ({
      ...moods,
      __typename: "Mood",
    })),
    ...narrativeTechniques.map((narrativeTechniques) => ({
      ...narrativeTechniques,
      __typename: "NarrativeTechnique",
    })),
    ...settings.map((settings) => ({
      ...settings,
      __typename: "Setting",
    })),
  ];
}

export async function getUserId({ agencyId, userinfo }) {
  const agencyAttributes = getUserInfoAccountsForAgency({
    agencyId,
    userinfo,
  });
  return getUserInfoAccountFromAgencyAttributes(agencyAttributes)?.userId;
}

export function getUserInfoAccountsForAgency({ agencyId, userinfo }) {
  return userinfo?.attributes?.agencies?.filter(
    (attributes) => attributes.agencyId === agencyId
  );
}

/**
 * Get the user info getUserInfoAccountFromAgencyAttributes from agencyAttributes.
 * If we have two agencyAttributes (local and cpr), we prefer getting the local id to avoid saving cpr
 * Used for already filtered agency attributes. Assumes only
 * @param {*} agencyAttributes
 * @returns
 */
export function getUserInfoAccountFromAgencyAttributes(agencyAttributes) {
  if (!agencyAttributes || agencyAttributes.length === 0) {
    log.error("No agencyAttributes found for user.");
    return null;
  }

  //if we have several ids, we prefer getting the local id to avoid saving cpr
  return (
    agencyAttributes?.find((attr) => attr.userIdType === "LOCAL") ||
    agencyAttributes?.find((attr) => attr.userIdType === "CPR") ||
    null
  );
}

/**
 * getHomeAgencyAccount
 * Prioritizes LOCAL account
 * @param userinfo - parse the data directy from userinfo datasource
 * @returns user account: { agencyId: String, userId: String, userIdType: String }
 */
export const getHomeAgencyAccount = (userinfo) => {
  const municipalityAgencyId = userinfo?.attributes?.municipalityAgencyId;

  /**
   * Firstly try getting the local account
   */
  const agencyAttributes = getUserInfoAccountsForAgency({
    agencyId: municipalityAgencyId,
    userinfo,
  });
  const accountLocal = getUserInfoAccountFromAgencyAttributes(agencyAttributes);
  if (accountLocal) return accountLocal;

  /**
   * Edge case for test users which municipalityAgencyId doesn't match their accounts
   * Return any LOCAL account
   */
  return userinfo?.attributes?.agencies.find(
    (account) => account.userIdType === "LOCAL"
  );
};

/**
 * Filter duplicates, since we get different userIdTypes (LOCAL, CPR)
 * If both LOCAL and CPR exists, prioritize LOCAL to minimize CPR's sent around services
 * @param userInfoAccounts: [{ agencyId: String, userId: String, userIdType: String }]
 * @returns [{ agencyId: String, userId: String, userIdType: String }]
 */
export const filterDuplicateAgencies = (userInfoAccounts) => {
  const result = [];

  if (!userInfoAccounts || userInfoAccounts.length === 0) {
    return result;
  }

  userInfoAccounts.forEach((account) => {
    const indexOf = result.map((e) => e.agencyId).indexOf(account.agencyId);

    if (indexOf === -1) {
      // Result doesn't contain agencyId, push this one
      result.push(account);
      return;
    }

    // result already contains agencyId, check if we want to replace it
    if (
      result[indexOf].userIdType === "CPR" &&
      account.userIdType === "LOCAL"
    ) {
      result.splice(indexOf, 1);
      result.push(account);
    }
  });

  return result;
};

/**
 *
 * @param {*} context context
 * @returns an array of users branch ids
 */
export const getUserBranchIds = async (context) => {
  const user = context?.user;

  const agencies = filterDuplicateAgencies(user?.agencies)?.map(
    (account) => account.agencyId
  );
  //fetch branches for each agency
  const agencyInfos = await Promise.all(
    agencies.map(
      async (agency) =>
        await context.datasources.getLoader("library").load({
          agencyid: agency,
          limit: 20,
          status: "ALLE",
        })
    )
  );

  //merge all branchIds into one array
  return agencyInfos
    .map((agency) => agency.result.map((res) => res.branchId))
    .flat();
};
/**
 * Receives a list of orderids. Fetches data for each orderid from ors-maintenance. Returns a list of populated data.
 *
 */
export const fetchOrderStatus = async (args, context) => {
  const { orderIds } = args;

  if (!orderIds || orderIds.length === 0) {
    throw new Error("No order IDs provided.");
  }
  //fetch order data for each orderID provided in the orderIds List
  const orders = await Promise.all(
    orderIds.map(async (orderId) => {
      const order = await context.datasources
        .getLoader("orderStatus")
        .load({ orderId });
      if (!order) {
        log.error(
          `Failed to fetch orderStatus. Order with order id ${orderId} not found.`
        );
        return {
          orderId,
          errorMessage: "Could not fetch order info from ors-maintenance.",
        };
      }
      return {
        orderId: order.orderId,
        closed: order.orderJSON?.closed,
        autoForwardResult: order.orderJSON?.autoForwardResult,
        placeOnHold: order.orderJSON?.placeOnHold,
        pickupAgencyId: order.pickupAgencyId,
        pid: order.orderJSON?.pid,
        pidOfPrimaryObject: order.orderJSON?.pidOfPrimaryObject,
        //Only "tidsskrifter" and "artikler" has titleOfComponent and authorOfComponent.
        author: order.orderJSON?.authorOfComponent || order.orderJSON?.author,
        title: order.orderJSON?.titleOfComponent || order.orderJSON?.title,
        creationDate: order.orderJSON?.creationDate,
      };
    })
  );
  return orders;
};

export async function resolveLocalizations(args, context) {
  // Remove openformat when the time is right
  const allmanifestations = await Promise.all(
    args.pids.map((pid) => {
      return context.datasources.getLoader("openformat").load(pid);
    })
  );

  const pids = allmanifestations.map(
    (manifestation) =>
      manifestation?.details?.hostPublicationPid?.$ ||
      manifestation.admindata.pid.$
  );

  // get localizations from openholdingstatus
  return await context.datasources.getLoader("localizations").load({
    pids: pids,
  });
}

const kglBibBranchIdSet = new Set([
  "800010",
  "800015",
  "800021",
  "800022",
  "800023",
  "800024",
  "800025",
  "800026",
  "800027",
  "800028",
  "800029",
  "800031",
  "800032",
  "800033",
  "800035",
  "800036",
  "800037",
  "800038",
  "800039",
  "800041",
  "800042",
  "800043",
  "800044",
  "800045",
  "800046",
  "800047",
  "800048",
  "800049",
  "809010",
  "809015",
]);

function handleLocalizationsWithKglBibliotek(
  localizationsWithHoldings,
  kglBibBranchIds = kglBibBranchIdSet
) {
  const localizationsWithHoldingsNotKglBibliotek = localizationsWithHoldings.filter(
    (agency) => !kglBibBranchIds.has(agency.agencyId)
  );

  const localizationsWithHoldingsIsKglBibliotek = localizationsWithHoldings.filter(
    (agency) => kglBibBranchIds.has(agency.agencyId)
  );

  const aggregateKglBibliotek =
    localizationsWithHoldingsIsKglBibliotek.length > 0
      ? [
          {
            agencyId: "800010",
            holdingItems: uniq(
              localizationsWithHoldingsIsKglBibliotek.flatMap(
                (localization) => localization.holdingItems
              )
            ),
          },
        ]
      : [];

  return [
    ...localizationsWithHoldingsNotKglBibliotek,
    ...aggregateKglBibliotek,
  ];
}

export async function resolveLocalizationsWithHoldings({
  args,
  context,
  offset,
  limit,
  language,
  status,
  bibdkExcludeBranches,
}) {
  const localizations = await resolveLocalizations(args, context);

  const detailedHoldingsCalls = localizations.agencies.map(async (agency) => {
    const localids = agency.holdingItems.map((item) => ({
      localIdentifier: item.localIdentifier,
      localisationPid: item.localizationPid,
      agency: item.agencyId,
    }));

    return await context.datasources.getLoader("detailedholdings").load({
      localIds: localids,
      agencyId: agency.agencyId,
    });
  });

  const detailedHoldings = await Promise.all(detailedHoldingsCalls);

  const agencyIds = new Set(
    detailedHoldings
      .filter((singleDetailedHolding) => {
        return (
          new Date(singleDetailedHolding.expectedDelivery).toDateString() ===
          new Date().toDateString()
        );
      })
      .map((singleDetailedHolding) => singleDetailedHolding.branchId)
  );

  const localizationsWithHoldings = localizations.agencies.filter((agency) =>
    agencyIds.has(agency.agencyId)
  );

  const localizationsWithHoldingsAndHandledKglBibliotek = handleLocalizationsWithKglBibliotek(
    localizationsWithHoldings
  );

  // AgencyNames for sorting by agencyName, via library datasource from vipCore
  const libraryDatasourcePromise = localizationsWithHoldingsAndHandledKglBibliotek
    ?.map((library) => library?.agencyId)
    ?.map(async (agencyId) => {
      const res = await context.datasources.getLoader("library").load({
        agencyid: agencyId,
        limit: 1,
        language: language,
        status: status || "ALLE",
        bibdkExcludeBranches: bibdkExcludeBranches ?? false,
      });
      return {
        agencyId: agencyId,
        agencyName: await res.result?.[0]?.agencyName,
      };
    });

  const libraryDatasource = await Promise.all(libraryDatasourcePromise);

  // IntersectionWith merges the arrays on agencyIds (merge by assign) without duplicate objects
  //   sortBy sorts the rest by agencyName
  const intersectingAgencyIdsFromLibrary = sortBy(
    intersectionWith(
      localizationsWithHoldingsAndHandledKglBibliotek,
      libraryDatasource,
      (a, b) => a.agencyId === b.agencyId && assign(a, b)
    ),
    "agencyName"
  );

  return {
    count: intersectingAgencyIdsFromLibrary.length,
    agencies: intersectingAgencyIdsFromLibrary.slice(offset, offset + limit),
  };
}

/**
 * returns true if input has CPR-number format (10 digits)
 * @param {String} uniqueId
 */
export function isCPRNumber(uniqueId) {
  return /^\d{10}$/.test(uniqueId);
}

/**
 * Check if periodicaForm contains the necessary fields to be a periodica
 * Otherwise we order entire edition/udgave as physical order instead of a single (digital) article
 * @param {Object} periodicaForm
 * @returns
 */
export function isPeriodica(periodicaForm) {
  if (!periodicaForm) return false;
  const {
    authorOfComponent,
    titleOfComponent,
    pagesOfComponent,
  } = periodicaForm;
  return authorOfComponent || titleOfComponent || pagesOfComponent;
}
