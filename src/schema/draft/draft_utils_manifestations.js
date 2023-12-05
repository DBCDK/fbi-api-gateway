/**
 * @file . set as much jed data as possible from the openformat display.
 * some jed data is partly filled - others totally absent
 *
 * NOTE - absent data - completely missing:
 * accessTypes
 * collectionIdentifiers
 * contributorsFromDescription
 * creatorsFromDescription
 * fictionNonFiction
 * identifiers
 * relatedPublications
 * recordCreationDate
 * series
 * source
 */

import * as consts from "./FAKE";
import { getArray, resolveManifestation } from "../../utils/utils";
import { collectSubFields } from "@graphql-tools/utils";
import translations from "../../utils/translations.json";

/**
 * convert manifestion data to JED
 * @param manifestation
 * @returns {{}}
 */
export function manifestationToJed(manifestation) {
  const jedData = {};
  jedData.pid = manifestation.admindata.pid.$;
  /*jedData.titles = jedTitles(manifestation);
  jedData.abstract = manifestation.details?.abstract?.value?.$
    ? [manifestation.details.abstract.value.$]
    : [];

  const creators = getArray(manifestation, "details.creators.value");
  jedData.creators = jedCreators(creators);

  jedData.audience = jedAudience(manifestation);
  jedData.classifications = [jedClassification(manifestation)];
  jedData.contributors = jedContributors(manifestation);
  jedData.edition = jedEdition(manifestation);
  jedData.latestPrinting = jedLatestPrinting(manifestation);
  jedData.genreAndForm = getArray(manifestation, "details.form.value").map(
    (gaf) => gaf.$
  );
  jedData.hostPublication = jedHostPublication(manifestation);
  jedData.languages = jedLanguages(manifestation);

  jedData.manifestationParts = jedManifestationParts(manifestation);
  jedData.materialTypes = jedMaterialTypes(manifestation);
  jedData.notes = jedNotes(manifestation);
  jedData.physicalDescriptions = jedPhysicalDescription(manifestation);
  jedData.publicationYear = jedPublicationYear(manifestation);
  jedData.publisher = getArray(
    manifestation,
    "details.publication.publisher"
  ).map((pub) => pub.$);
  jedData.shelfmark = jedShelfMark(manifestation);
  jedData.subjects = jedSubjects(manifestation);
  jedData.volume = manifestation.details?.volume?.$ || null;
  jedData.tableOfContents = jedTableOFContent(manifestation);*/

  return jedData;
}

function jedTableOFContent(manifestation) {
  // content comes as a string from openformat - split on ';'
  const content = manifestation.details?.content?.value?.$;
  if (!content) {
    return null;
  }

  const contentArray = content.split(";");
  const listcontent = contentArray?.map((con) => {
    return { heading: "", content: con };
  });

  return { ...consts.FAKE_LIST_OF_CONTENT, ...{ listOfContent: listcontent } };
}

function jedSubjects(manifestation) {
  const subjects = getArray(manifestation, "details.subject");
  const all = subjects?.map((sub) => {
    return { ...consts.FAKE_SUBJECTS.all[0], ...{ display: sub.value.$ } };
  });
  return { ...consts.FAKE_SUBJECTS, ...{ all: all } };
}

function jedShelfMark(manifestation) {
  if (!manifestation.details?.shelf) {
    return null;
  }

  // Shelfmark is actually postfix - its switched up in openformat.
  // We switch it back here, while we await the JED..
  const jedData = {
    postfix: manifestation.details?.shelf?.shelfmark?.$ || "",
    shelfmark: manifestation.details?.shelf?.prefix?.$ || "",
  };
  return { ...consts.FAKE_SHELFMARK, ...jedData };
}

function jedPublicationYear(manifestation) {
  const pubyear =
    manifestation.details?.publication?.publicationYear?.$ || null;
  return {
    ...consts.FAKE_PUBLICATIONYEAR,
    ...{
      year: Number.isInteger(parseInt(pubyear, 10)) && pubyear,
      display: pubyear || "",
    },
  };
}

function jedPhysicalDescription(manifestation) {
  const descriptions = getArray(
    manifestation,
    "details.physicalDescription.value"
  );
  const jedData = descriptions.map((desc) => {
    return { ...consts.FAKE_PHYSICALDESCRIPTION, ...{ summary: desc.$ } };
  });
  return jedData;
}

function jedNotes(manifestation) {
  const notes = getArray(manifestation, "details.notes.value");

  const jedData = notes.map((note) => {
    return { ...consts.FAKE_NOTES, ...{ display: [note.$] } };
  });

  return jedData;
}

function jedMaterialTypes(manifestation) {
  const mattype = getArray(manifestation, "details.materialType");

  const types = mattype.map((mat) => {
    return { general: mat.$, specific: mat.$ };
  });
  return types.length > 0 ? types : [consts.FAKE_MATERIALTYPE];
}

/**
 <<<<<<< HEAD
 * manifestationParts - this one is done with a music example pid: "870970-basis:22417657"
 *  missing:
 *  classifications
 *  subjects
 *  creatorsFromDescription
 *  type
 *
 * @param manifestation
 * @returns {{heading: string, parts: [{classifications: [{system: string, code: string, display: string}], creators: [{firstName: string, lastName: string, __typename: string, display: string, roles: [], nameSort: string}], creatorsFromDescription: [string], title: string}], type: string}}
 */
function jedManifestationParts(manifestation) {
  const tracks = getArray(manifestation, "details.tracks");

  const jedData = {};
  jedData["heading"] = tracks[0]?.header?.$ || "";

  // @TODO find parts array in a good way
  const parts =
    tracks[1] && tracks[1]?.track && Array.isArray(tracks[1]?.track)
      ? tracks[1]?.track
      : (tracks[1]?.track && [tracks[1]?.track]) || null;

  jedData["parts"] = parts
    ? parts.map((tr) => {
        let creators = jedCreators([tr.creator]);
        return { title: tr.title?.$ || "", creators: creators || [] };
      })
    : [];

  return { ...consts.FAKE_MANIFESTATION_PARTS, ...jedData };
}

/**
 =======
 >>>>>>> master
 * Languages
 *
 *  missing:
 *  original
 *  parallel
 *  abstract
 * @param manifestation
 * @returns {{subtitles: *, spoken: *, main: *}}
 */
function jedLanguages(manifestation) {
  /*array with objects {display, isocode}*/

  let tmpArr = getArray(manifestation, "details.languages.languageSpoken");
  const spoken = tmpArr.map((lang) => {
    // we have no iso code for spoken languages in dkabm
    return { display: lang.$, isoCode: "" };
  });

  tmpArr = getArray(manifestation, "details.languages.languageMain");
  const main = tmpArr.map((lang) => {
    // we only have iso code for main language from openformat (missing a xpath expression in code)
    return {
      display: translations.facets.mainLanguages[lang.$]?.["da"],
      isoCode: lang.$,
    };
  });

  tmpArr = getArray(manifestation, "details.languages.languageSubtitles");
  const subtitles = tmpArr.map((lang) => {
    // we have no iso code for subtitles in dkabm
    return { display: lang.$, isoCode: "" };
  });

  return {
    ...consts.FAKE_LANGUAGES,
    ...{
      main: main,
      spoken: spoken,
      subtitles: subtitles,
    },
  };
}

/**
 * Info for host publication
 *
 *
 * @TODO
 *  Found some articles with a hostpublication - but no books as hostpublication
 *  isbn (for books) -- where to get it from
 *  creator -- if host publication is a book - where to get it from ?
 *  notes -- found no notes for the articles sofar
 *  series -- there are some series information in manifestation -- but how should we handle it
 *
 * @param manifestation
 * @returns {{summary, creator: string, notes: [string], pages, issue, issn, year, series: {works: [], parallelTitles: string[], title: string, numberInSeries: {number: number, display: string}}, isbn: string, publisher, title}}
 */
function jedHostPublication(manifestation) {
  // the host publication
  const hostpub = manifestation.details?.hostPublication;
  // the publication itself
  const pub = manifestation.details?.publication;
  // the article
  const art = manifestation.details?.articleData?.article;
  const jedData = {
    summary: hostpub?.value?.$ || "",
    publisher: hostpub?.title?.$ || "",
    pages: art?.pages?.$ || "",
    title: hostpub?.title?.$ || "",
    year: { display: art?.year?.$ || "", year: art?.year?.$ || 0 },
    issue: hostpub?.details?.$ || "",
    issn: manifestation?.details?.articleIssn?.value?.$ || "",
  };
  return { ...consts.FAKE_HOST_PUBLICATION, ...jedData };
}

/**
 * Parse for titles - @see /draft/manifestation::ManifestationTitles
 *
 * @param manifestation
 * @returns {{identifyingAddition: string, standard: string, original: [string], parallel: string[], alternative: [string], main: [string], sort: string, translated: [string], full: [string]}}
 */
function jedTitles(manifestation) {
  /* NOTES .. we do not get properties marked with * MISSION in object below
  @TODO get missing properties from somewhere
  {
  main: ['Some Title'],
  full: ['Some Title: Full'],
  alternative: ['Some Title: Alternative'], - * MISSING
  identifyingAddition: 'Indlæst af Jens Jensen', * MISSING
  original: ['Some Title: Original'],
  parallel: ['Parallel Title 1', 'Parallel Title 2'], * MISSING
  sort: 'Some Title Sort', * MISSING
  standard: 'Some Title Standard', * MISSING
  translated: ['En Oversat Titel'], * MISSING
}
   */
  // we need to do a check before setting the object
  const mainTitles = manifestation.details?.title?.value?.$
    ? [manifestation.details?.title?.value?.$]
    : [];
  const titleFull = manifestation.details?.titleFull?.value.$
    ? [manifestation.details?.titleFull?.value.$]
    : [];
  const originalTitle = manifestation.details?.originalTitle?.value.$
    ? [manifestation.details?.originalTitle?.value.$]
    : [];
  return {
    ...consts.FAKE_MANIFESTATION_TITLE,
    ...{
      main: mainTitles,
      full: titleFull,
      original: originalTitle,
    },
  };
}

function jedLatestPrinting(manifestation) {
  const jedData = {};
  const summaryTxt = manifestation.details?.latestReprint?.value?.$;
  if (summaryTxt) {
    jedData["summary"] = summaryTxt;
  }
  return { ...consts.FAKE_LATEST_PRINTING, ...jedData };
}

function jedEdition(manifestation) {
  const jedData = {};
  const publication = manifestation.details?.publication;

  const summaryTxt = `${manifestation.details?.edition?.value?.$ || ""}, ${
    publication?.publisher?.$ || ""
  }, ${publication?.publicationYear?.$}`;
  jedData["summary"] = summaryTxt;
  const edition = manifestation.details?.edition?.value?.$;
  if (edition) {
    jedData["edition"] = edition;
  }
  const publicationYear = {
    display: publication?.publicationYear?.$ || "",
    year: publication?.publicationYear?.$ || 0,
  };
  if (publicationYear) {
    jedData["publicationYear"] = {
      ...consts.FAKE_EDITION.publicationYear,
      ...publicationYear,
    };
  }

  return {
    ...consts.FAKE_EDITION,
    ...jedData,
  };
}

function jedContributors(manifestation) {
  const contributors = getArray(manifestation, "details.contributors.value");
  const jedData = contributors.map((contributor) => {
    const role = contributor.functionCode?.$
      ? {
          ...{ functionCode: contributor.functionCode?.$ },
          ...{
            function: {
              ...consts.FAKE_TRANSLATION,
              ...{
                plural: contributor.functionPlural?.$,
                singular: contributor.functionSingular?.$,
              },
            },
          },
        }
      : false;

    return {
      ...consts.FAKE_PERSON,
      ...{
        display: contributor.name?.$,
        nameSort: contributor.name?.$,
        roles: role
          ? [
              {
                ...consts.FAKE_ROLE,
                ...role,
              },
            ]
          : [],
      },
    };
  });

  return jedData;
}

/**
 * Classifications - for now we only handle dk5
 * @param manifestation
 * @returns {{entryType: string, system: string, code: string, display: string}}
 */
function jedClassification(manifestation) {
  /*
  {
  system: 'DK5',
  code: '86-096',
  display: 'Skønlitteratur',
  entryType: 'NATIONAL_BIBLIOGRAPHY_ENTRY',
}
   */
  const jedData = {};
  if (manifestation.details?.dk5?.value) {
    jedData["system"] = "DK5";
    jedData["code"] = manifestation.details?.dk5?.value.$;
    jedData["entryType"] = "NATIONAL_BIBLIOGRAPHY_ENTRY";
    jedData["display"] = manifestation.details?.dk5?.value.$;
  }

  return { ...consts.FAKE_CLASSIFICATION, ...jedData };
}

function jedAudience(manifestation) {
  /*
  generalAudience: ['general audience'],
  ages: [{display: '10-14', begin: 10, end: 14}],
  libraryRecommendation: 'some library recommendation',
  childrenOrAdults: [{display: 'til børn', code: 'FOR_CHILDREN'}],
  schoolUse: [{display: 'til skolebrug', code: 'FOR_SCHOOL_USE'}],
  primaryTarget: ['Some primary target'],
  let: 'some let',
  lix: 'some lix',
   */

  const parsedAudience = parseAudienceAges(manifestation.details?.audience);

  return {
    ...consts.FAKE_AUDIENCE,
    ...{
      let: manifestation.details?.lettal?.value?.$,
      lix: manifestation.details?.lix?.value?.$,
      generalAudience: parsedAudience,
    },
  };
}

/**
 * This one is hard - ages for audience is from 666*u .. but ..
 * examples on values from 666*u:
 *
 *  for hoejtlaesningr
 *  for 10 aar
 *  for børnehaveklasse
 *  for pædagoger
 *  for 16 år
 *  ... etc ..
 * what to do ?
 *
 * for now return all of the values for 'generalAudience'
 *
 * @param ages
 * @returns {boolean}
 */
function parseAudienceAges(audience) {
  if (!audience) {
    return [];
  }

  return audience?.map((aud) => aud.value.$);
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
    user?.municipality || parseForMunicipalityNumber(user.municipalityAgencyId);

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

  const parent =
    typeof manifestation === "object"
      ? manifestation
      : await resolveManifestation({ pid: manifestation }, context);

  const res = [];

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
    res.push({
      __typename: "InfomediaService",
      id: parent.access.infomediaService.id,
    });
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
    res.push({ __typename: "InterLibraryLoan", loanIsPossible: true });
  }

  // Return array containing all types of access
  return _sortOnlineAccess(res);
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

/**
 * Parse for creators - @see /draft/creator.js
 * @param manifestation
 * @returns {{firstName: string, lastName: string, aliases: [{display: string},{display: string}], birthYear: string, attributeToName: string, __typename: string, display: *, romanNumeral: string, roles: [{functionCode: (string|*), valueOf?(): boolean, function: ({plural: string, singular: string}|{plural: *, singular: *})}]|[], nameSort: *}[]}
 */
function jedCreators(creators) {
  const jedData = creators?.map((creator) => {
    const role = creator?.functionCode?.$
      ? {
          ...{ functionCode: creator.functionCode?.$ },
          ...{
            function: {
              ...consts.FAKE_TRANSLATION,
              ...{
                plural: creator.functionPlural?.$,
                singular: creator.functionSingular?.$,
              },
            },
          },
        }
      : false;

    return {
      ...consts.FAKE_PERSON,
      ...{
        display: creator?.name?.$,
        nameSort: creator?.name?.$,
        roles: role
          ? [
              {
                ...consts.FAKE_ROLE,
                ...role,
              },
            ]
          : [],
      },
    };
  });

  return jedData;
}
