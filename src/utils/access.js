/**
 * @file access util functions
 */

import { filterDuplicateAgencies, resolveManifestation } from "./utils";

/**
 *
 * Check whether any of the users libraries has access to Infomedia.
 * The returned agencyId will be billed for infomedia access.
 *
 * First we check if the users login library has access to info media, if not,
 * we check if any other og the users associated accounts has access to infomedia,
 * if so, we return the first one found.
 *
 * @param {object} context
 *
 * @returns {null | string} AgencyId
 */
async function infomedia(context) {
  const user = context?.user;

  // get rights from idp
  const idpRights = await context.datasources.getLoader("idp").load("");

  // check if users loggedInAgency has infomedia access
  const loggedInAgencyId = user?.loggedInAgencyId;

  if (loggedInAgencyId && idpRights[loggedInAgencyId]) {
    return loggedInAgencyId;
  }

  /*
   * Alternativly check all users accounts
   */

  // filtered accounts
  const userInfoAccounts = filterDuplicateAgencies(user.agencies);

  const hasAccess = userInfoAccounts?.filter(
    ({ agencyId }) => idpRights[agencyId]
  );

  // check for infomedia access - if any of users agencies subscribes
  if (hasAccess.length > 0) {
    return hasAccess[0]?.agencyId;
  }

  return null;
}

/**
 *
 * @param {object} context
 *
 * @returns {null | string} AgencyId
 */
export async function getInfomediaAgencyId(context) {
  return await infomedia(context);
}

/**
 *
 * @param {object} context
 *
 * @returns {boolean}
 */
export async function hasInfomediaAccess(context) {
  return !!(await infomedia(context));
}

/**
 * Get type of access for manifestation with given pid.
 *  url access
 *  ill access
 *  infomedia access
 *  digital article service access
 *
 * @param pid
 * @param context
 * @returns {Promise<*>}
 */
export async function resolveAccess(manifestation, context) {
  // We parse the access structure from JED, and convert it
  // to the union type structure.
  // At some point we may choose to follow the structure of JED closely,
  // but it has to be coordinated with stakeholders

  let parent =
    typeof manifestation === "object"
      ? manifestation
      : await resolveManifestation({ pid: manifestation }, context);

  const res = [];

  // use linkchecker to check status of a single accessUrl
  // linkchecker does NOT handle proxy urls, so we skip ebookcentral and ebsco urls
  const linkStatus = async (url) => {
    if (url?.includes("ebookcentral") || url?.includes("ebscohost")) {
      return "OK";
    }

    const linkcheck = await context.datasources
      .getLoader("linkcheck")
      .load({ urls: [url] });
    const link = linkcheck.find((check) => check.url === url);

    return link?.status || "OK";
  };

  parent?.access?.accessUrls?.forEach((entry) => {
    const { proxyUrl, loginRequired } = getProxyUrl(
      entry.url || "",
      context?.user
    );

    res.push({
      __typename: "AccessUrl",
      origin: parseOnlineUrlToOrigin(entry.url),
      url: proxyUrl,
      loginRequired,
      note: entry.note,
      type: entry.type,
      status: linkStatus(proxyUrl) || "OK",
    });
  });

  if (parent?.access?.dbcWebArchive) {
    const archives = await context.datasources
      .getLoader("moreinfoWebarchive")
      .load(parent.pid);

    archives.forEach((archive) => {
      if (archive.url) {
        res.push({
          __typename: "AccessUrl",
          url: archive.url,
          origin: parseOnlineUrlToOrigin(archive.url),
          loginRequired: false,
          type: "RESOURCE",
          status: linkStatus(archive.url) || "OK",
        });
      }
    });
  }

  parent?.access?.ereol?.forEach((entry) => {
    res.push({
      __typename: "Ereol",
      origin: entry.origin,
      url: entry.url,
      canAlwaysBeLoaned: entry.canAlwaysBeLoaned,
      note: entry.note,
    });
  });

  if (parent?.access?.infomediaService?.id) {
    if (
      !["politiken", "jyllands-posten"].some((publication) =>
        parent?.hostPublication?.title?.toLowerCase()?.includes(publication)
      )
    ) {
      res.push({
        __typename: "InfomediaService",
        id: parent.access.infomediaService.id,
      });
    }

    // If this is a omitted online access for politiken or jyllands-posten.
    else {
      const hasPhysical = parent?.accessTypes?.some(
        (t) => (t?.code ?? "").toUpperCase() === "PHYSICAL"
      );

      if (hasPhysical) {
        parent = {
          ...parent,
          access: {
            ...(parent.access ?? {}),
            interLibraryLoanIsPossible: true,
          },
        };
      }
    }
  }

  // Get the issn for this article or periodica
  const issn =
    parent?.access?.digitalArticleService?.issn ||
    parent?.identifiers?.find?.((id) => id.type === "ISSN")?.value;

  if (issn) {
    const journals = await context.datasources
      .getLoader("statsbiblioteketJournals")
      .load("");
    const articleissn = issn.replace(/[^a-z\d]/gi, "");
    const hasJournal = journals && journals[articleissn];
    if (hasJournal) {
      res.push({
        __typename: "DigitalArticleService",
        issn: articleissn,
      });
    }
  }

  if (parent?.access?.interLibraryLoanIsPossible) {
    //if collectionidentifiers includes 870970-accessnew it may be loaned
    const isNewMaterial =
      parent?.collectionIdentifiers?.includes("870970-accessnew");

    const forLoan = checkInterLibraryLoan(parent, context);
    res.push({
      __typename: "InterLibraryLoan",
      loanIsPossible: forLoan,
      accessNew: isNewMaterial,
    });
  }

  // Return array containing all types of access
  return _sortOnlineAccess(res);
}

/**
 * municipality number is the second|third|fourth digit in agencyId
 * @param agencyId
 * @returns {string | undefined}
 */
function parseForMunicipalityNumber(agencyId) {
  return agencyId?.substring(1, 4);
}

/**
 * This one is for ebook.plus - we need to go via a proxy url (if user is logged in)
 * @param url
 * @param user
 * @returns {*}
 */
export function getProxyUrl(url, user) {
  const municipality =
    user?.municipality ||
    parseForMunicipalityNumber(user?.municipalityAgencyId);

  // check if we should proxy this url - for now it is ebookcentral and ebscohost
  const proxyMe =
    url.indexOf("ebookcentral") !== -1 || url.indexOf("ebscohost") !== -1;
  if (proxyMe) {
    // check if user is logged in
    if (user?.userId) {
      const realUrl = `https://bib${municipality}.bibbaser.dk/login?url=${url}`;
      return { proxyUrl: realUrl, loginRequired: proxyMe };
    }
  }

  return { proxyUrl: url, loginRequired: proxyMe };
}

/**
 * Some sources are not for loan (fagbibliografier) - for now a statis list:
 * This method is only called if interLibraryLoan is true - We know that for a fact
 * 159080-fagbib - Besættelsesbibliografien
 * 159081-fagbib - Bibliografi over Dansk Kunst
 * 159082-fagbib - Dansk Historisk Bibliografi
 * 159083-fagbib - Dansk Musiklitterær Bibliografi
 * 159084-fagbib - Kongelige Teater programartikler
 * 159085-fagbib - Dania Polyglotta
 * 159086-fagbib - Sportline
 * @param parent
 * @param context
 */
function checkInterLibraryLoan(parent, context) {
  // This is a blacklist of bases NOT to be loaned
  const notForLoanList = [
    "159080-fagbib",
    "159081-fagbib",
    "159082-fagbib",
    "159083-fagbib",
    "159084-fagbib",
    "159085-fagbib",
    "159086-fagbib",
  ];
  // we check on objectId - first part is the source
  const source = parent?.objectId?.split(":")[0];
  return !notForLoanList.includes(source);
}

/**
 * Get domain from url
 * @param url
 * @return String
 *  A parsed string eg. "DBC Webarkiv" or name of host eg. "infolink2003.elbo.dk"
 *
 * */
export function parseOnlineUrlToOrigin(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl["host"] === "moreinfo.addi.dk") {
      return "DBC Webarkiv";
    } else {
      return (parsedUrl["host"] && parsedUrl["host"]) || "";
    }
  } catch (e) {
    return "";
  }
}

/**
 * Handle special cases - for now we want filmstriben/fjernleje BEFORE filmstriben/biblioteket AND
 * we want dansk film institut (dfi) to come last - it is not a 'real' url but a link to a description
 * @param onlineAccess
 * @return {*}
 * @private
 */
function _sortOnlineAccess(onlineAccess) {
  const specialSort = (a, b) => {
    // fjernleje should be on top
    if (b.url && b.url.indexOf("filmstriben.dk/fjernleje") !== -1) {
      return 1;
    } else if (a.url && a.url.indexOf("filmstriben.dk/fjernleje") !== -1) {
      return -1;
      // dfi is not a 'real' online url - sort low
    } else if (b.url && b.url.indexOf("dfi.dk") !== -1) {
      return -1;
    } else if (a.url && a.url.indexOf("dfi.dk") !== -1) {
      return 1;
    }
    return 0;
  };

  return onlineAccess.sort(specialSort);
}
