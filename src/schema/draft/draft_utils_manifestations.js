import * as consts from './FAKE';
import {getArray} from '../../utils/utils';

/**
 * convert manifestion data to JED
 * @param manifestation
 * @returns {{}}
 */
export function manifestationToJed(manifestation) {
  const jedData = {};
  jedData.pid = manifestation.admindata.pid.$;
  jedData.creators = jedCreators(manifestation);
  jedData.titles = jedTitles(manifestation);
  if (manifestation.details?.abstract?.value?.$) {
    jedData.abstract = [manifestation.details.abstract.value.$];
  }

  return jedData;
}

export async function resolveOnlineAccess(pid, context) {
  const result = [];
  // Get onlineAccess from openformat (UrlReferences)
  const manifestation = await context.datasources.openformat.load(pid);
  const data = getArray(manifestation, "details.onlineAccess");
  data.forEach((entry) => {
    if (entry.value) {
      result.push({
        __typename:"Draft_URL",
        url: (entry.value.link && entry.value.link.$) || "",
        origin: "fisk"
        //note: (entry.value.note && entry.value.note.$) || "",
        //accessType: (entry.accessUrlDisplay && entry.accessUrlDisplay.$) || "",
      });
    }
  });

  let infomedia =
      (manifestation &&
          manifestation.details &&
          manifestation.details.infomedia &&
          manifestation.details.infomedia.id) ||
      null;

  if (infomedia) {
    if (!Array.isArray(infomedia)) {
      infomedia = [infomedia];
    }
    infomedia.forEach((id) => {
      if (id.$) {
        result.push({
          __typename: "Draft_InfomediaService",
          infomediaId: id.$ || ""
        });
      }
    });
  }

  let webarchive =
      (manifestation &&
          manifestation.details &&
          manifestation.details.webarchive &&
          manifestation.details.webarchive.$) ||
      null;
  if (webarchive) {
    const archives = await context.datasources.moreinfoWebarchive.load(
        manifestation.admindata.pid.$
    );

    archives.forEach((archive) => {
      if (archive.url) {
        result.push({
          __typename:"Draft_URL",
          url: archive.url,
          origin: "webarchive"
        });
      }
    });
  }

  const articleIssn =
      getArray(manifestation, "details.articleIssn.value").map(
          (entry) => entry.$
      )[0] ||
      getArray(manifestation, "details.issn.value").map((entry) => entry.$)[0];

  if (articleIssn) {
    const journals = await context.datasources.statsbiblioteketJournals.load(
        ""
    );

    const articleissn = articleIssn.replace(/[^a-z\d]/gi, "");


    const hasJournal = journals && journals[articleissn];
    if (hasJournal) {
      result.push({
        __typename:"Draft_DigitalArticleService",
        issn:articleissn,
        subscribed: true
      });
    }
  }

  // Return array containing both InfomediaReference, UrlReferences, webArchive and DigitalCopy
  return _sortOnlineAccess(result);
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
  // we need to do a check before setting the object - hence a lot of deconstruction
  return {
    ...consts.FAKE_MANIFESTATION_TITLE, ...{
      ...(manifestation.details?.title?.value?.$) &&
      {main: [manifestation.details?.title?.value?.$]},
      ...(manifestation.details?.titleFull?.value.$) &&
      {full: [manifestation.details?.titleFull?.value.$]},
      ...(manifestation.details?.originalTitle?.value.$) &&
      {original: [manifestation.details?.originalTitle?.value.$]},
    },
  };
}

function jedCreators(manifestation) {
  const creators = getArray(manifestation, 'details.creators.value');
  const jedData = creators.map((creator) => {
    const role = creator.functionCode?.$ ? {
      ...{functionCode: creator.functionCode?.$},
      ...{
        function: {
          ...consts.FAKE_TRANSLATION,
          ...{
            plural: creator.functionPlural?.$,
            singular: creator.functionSingular?.$,
          },
        },
      },
    } : false;

    return {
      ...consts.FAKE_PERSON,
      ...{
        display: creator.name?.$,
        nameSort: creator.name?.$,
        roles: role ? [
          {
            ...consts.FAKE_ROLE, ...role,
          },
        ] : [],
      },
    };
  });

  return jedData;
}
