import { get, uniq } from "lodash";
import fs from "fs";
import path from "path";

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

/**
 * Generates the work page description
 * @param {object} work The work
 * @returns {string}
 */
export function getPageDescription({ title, creators, materialTypes }) {
  const creator = creators[0] && creators[0].name;
  const allowedTypes = ["lydbog", "ebog", "bog"];
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
  fs.readdirSync(dir).forEach((file) => {
    // builds full path of file
    const fPath = path.resolve(dir, file);

    // prepare stats obj
    const fileStats = { file, path: fPath };

    // if its a folder, we get files from that
    if (fs.statSync(fPath).isDirectory()) {
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

  const details = {};
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

export async function resolveBorrowerCheck(agencyId, context) {
  // returns true if login.bib.dk is supported
  if (!agencyId) {
    return false;
  }
  const res = await context.datasources.vipcore_UserOrderParameters.load(
    agencyId
  );
  if (res.agencyParameters && res.agencyParameters.borrowerCheckParameters) {
    return !!res.agencyParameters.borrowerCheckParameters.find(
      ({ borrowerCheckSystem, borrowerCheck }) =>
        borrowerCheckSystem === "login.bib.dk" && borrowerCheck
    );
  }
  return false;
}

export async function resolveOnlineAccess(pid, context) {
  const result = [];

  // Get onlineAccess from openformat (UrlReferences)
  const manifestation = await context.datasources.openformat.load(pid);

  const data = getArray(manifestation, "details.onlineAccess");
  data.forEach((entry) => {
    if (entry.value) {
      result.push({
        url: (entry.value.link && entry.value.link.$) || "",
        note: (entry.value.note && entry.value.note.$) || "",
        accessType: (entry.accessUrlDisplay && entry.accessUrlDisplay.$) || "",
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
          type: "infomedia",
          infomediaId: id.$ || "",
          pid: manifestation.admindata.pid.$,
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
          type: "webArchive",
          url: archive.url,
          pid: manifestation.admindata.pid.$,
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

    const issn = articleIssn.replace(/[^a-z\d]/gi, "");
    const hasJournal = journals && journals[issn];
    if (hasJournal) {
      result.push({
        issn,
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
