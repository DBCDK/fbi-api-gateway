import { graphql } from "graphql";
import { getExecutableSchema } from "../schemaLoader";
import { get, uniq } from "lodash";

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

export async function resolveBorrowerCheck(agencyId, context) {
  // returns true if login.bib.dk is supported
  if (!agencyId) {
    return false;
  }
  const res = await context.datasources
    .getLoader("vipcore_UserOrderParameters")
    .load(agencyId);
  if (res.agencyParameters && res.agencyParameters.borrowerCheckParameters) {
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
  if (!context?.smaug?.user?.id) {
    return "USER_NOT_LOGGED_IN";
  }

  let userInfo;
  try {
    userInfo = await context.datasources.getLoader("userinfo").load({
      accessToken: context.accessToken,
    });
  } catch (e) {
    return "USER_NOT_LOGGED_IN";
  }

  const municipalityAgencyId = userInfo?.attributes?.municipalityAgencyId;

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
  if (!context?.smaug?.user?.id) {
    return "USER_NOT_LOGGED_IN";
  }

  let userInfo;
  try {
    userInfo = await context.datasources.getLoader("userinfo").load({
      accessToken: context.accessToken,
    });
  } catch (e) {
    return "USER_NOT_LOGGED_IN";
  }

  const municipalityAgencyId = userInfo?.attributes?.municipalityAgencyId;

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
    id = args.id;
  } else if (args.faust) {
    id = await context.datasources
      .getLoader("faustToWorkId")
      .load({ faust: args.faust, profile: context.profile });
  } else if (args.pid) {
    id = await context.datasources
      .getLoader("pidToWorkId")
      .load({ pid: args.pid, profile: context.profile });
  }
  if (!id) {
    return null;
  }

  const w = await context.datasources.getLoader("jedWork").load({
    workId: id,
    profile: context.profile,
  });

  return w?.data?.work;
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

  const res = await context.datasources.getLoader("jedManifestation").load({
    pid,
    profile: context.profile,
  });

  if (!res?.data?.manifestation) {
    return null;
  }

  return res?.data?.manifestation;
}

/**
 * Take Jed subjects object, and returns FBI-API list of subjects
 */
export function parseJedSubjects({
  corporations = [],
  persons = [],
  subjects = [],
  timePeriods = [],
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
    ...timePeriods.map((timePeriod) => ({
      ...timePeriod,
      __typename: "TimePeriod",
    })),
  ];
}
