import config from "../config";

const { url, ttl , teamLabel } = config.datasources.openformat;

function parseResponse(response) {
  const risArray = response?.body?.objects?.map(
    (obj) => obj?.ris?.[0]?.formatted?.records?.[0]
  );

  const responseAsString = risArray.map((ris) => formatResponseToRis(ris));
  return responseAsString.join("\n");
}

export function formatResponseToRis(response) {
  const obj = response?.ris;
  let result = "";
  for (let key in obj) {
    if (Object.keys(obj[key])?.length > 0) {
      if (key === "AU") {
        // If author has middle name as part of last name, move it to first name.
        if (Array.isArray(obj[key].value)) {
          for (let k in obj[key].value) {
            obj[key].value[k] = obj[key].value[k].replace(
              /(.*) (.*), (.*)/i,
              "$2, $3 $1"
            );
          }
        } else {
          obj[key].value = obj[key].value.replace(
            /(.*) (.*), (.*)/i,
            "$2, $3 $1"
          );
        }
      }
      if (key === "TY") {
        // Only use first occurence.
        result += key + "  - " + translateType(String(obj[key][0])) + "\n";
      } else if (key === "TYPE") {
        result = changeType(result, String(obj[key].value));
      } else if (obj[key].hasOwnProperty("value")) {
        // Content note (in order to reuse config field).
        if (obj[key].value[0].hasOwnProperty("contentText")) {
          result += key + "  - " + obj[key].value[0].contentText + "\n";
        } else {
          if (Array.isArray(obj[key].value)) {
            for (let l in obj[key].value) {
              result += key + "  - " + obj[key].value[l] + "\n";
            }
          } else {
            result += key + "  - " + obj[key].value + "\n";
          }
        }
      } else {
        for (let m in obj[key]) {
          if (obj[key][m].hasOwnProperty("value")) {
            if (obj[key][m]?.value[0].hasOwnProperty("contentText")) {
              result += key + "  - " + obj[key][m].value[0].contentText + "\n";
            } else {
              result += key + "  - " + obj[key][m].value + "\n";
            }
          } else {
            result += key + "  - " + obj[key][m] + "\n";
          }
        }
      }
    }
  }
  // NOTE tag is used in order to be able to combine content produced by
  // field config with content from function.
  result = result.replace(/NOTE  -/g, "N1  -");
  // Required to end the RIS record.
  result += "ER  -";
  return result;
}

/**
 * Helper function to change type to more specific RIS type.
 *
 * @param {String} result RIS text string
 * @param {String} type type to match
 * @returns {String} changed result
 * @function
 */
function changeType(result, type) {
  switch (type) {
    // This means that the material is electronic material.
    // bibdk material types do not specify if an article is electronic.
    case "xe":
      result = result.replace("TY  - JOUR", "TY  - EJOUR");
      break;
    case "chapter":
      result = result.replace("TY  - JOUR", "TY  - CHAP");
      break;
    // This means that the record has a creator qualified with a
    // function code, labeling the creator as an interviewer, and the
    // type of the material is therefore an interview.
    case "ive":
      result = result.replace("TY  - JOUR", "TY  - INTV");
      break;
    default:
      break;
  }
  return result;
}

/**
 * Translates bibdk material type to RIS reference type.
 *
 * @param {String} type string to translate
 * @returns {String} converted json as string
 * @function
 */
function translateType(type) {
  switch (type) {
    case "Anmeldelse":
    case "Artikel":
    case "Tidsskriftsartikel":
      return "JOUR";
      break;
    case "Avisartikel":
      return "NEWS";
      break;
    case "Billedbog":
    case "Bog":
    case "Bog stor skrift":
    case "Tegneserie":
    case "Graphic novel":
    case "Lydbog (bånd)":
    case "Lydbog (cd-mp3)":
    case "Lydbog (cd)":
    case "Lydbog (net)":
      return "BOOK";
      break;
    case "Blu-ray":
    case "Dvd (film)":
    case "Dvd":
    case "Film":
    case "Film (net)":
      return "MPCT";
      break;
    case "Cd":
    case "Cd (musik)":
    case "Grammofonplade":
    case "Musik (net)":
      return "SOUND";
      break;
    case "Kort":
      return "MAP";
      break;
    case "Netdokument":
      return "ELEC";
      break;
    case "Node":
    case "E-node":
      return "MUSIC";
      break;
    case "GameBoy":
    case "GameBoy Advance":
    case "Nintendo DS ":
    case "Pc-spil":
    case "Pc-spil (net)":
    case "Playstation":
    case "Playstation 2":
    case "Playstation 3":
    case "Playstation 4":
    case "Playstation Vita":
    case "PSP":
    case "Wii":
    case "Wii U":
    case "Xbox":
    case "Xbox 360":
    case "Xbox One":
      return "COMP";
      break;
    case "Ebog":
    case "Billedbog (net)":
      return "EBOOK";
      break;
    case "Billedkort":
    case "Maleri":
    case "Originalkunst":
    case "Tegning":
    case "Udstilling":
    case "Udstillingsmontage":
      return "ART";
      break;
    case "Periodikum":
    case "Periodikum (net)":
    case "Tidsskrift":
    case "Tidsskrift (net)":
    case "Avis":
    case "Avis (net)":
      return "JFULL";
      break;
    case "Serie":
      return "SER";
      break;
    case "Studenterprojekt":
      return "THES";
      break;
    case "Video":
      return "VIDEO";
      break;
    default:
      return "GEN";
      break;
  }
}

async function postObject(pids, uuid) {
  const repositoryIds = pids.map((pid) => ({
    repositoryId: pid,
  }));

  return {
    formats: [
      {
        name: "ris",
        mediaType: "application/json",
      },
    ],
    objects: repositoryIds,
    trackingId: uuid || "",
  };
}

export async function load({ pids }, context) {
  const params = await postObject(pids, context?.trackingId);

  const response = await context.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: "ris-1",
    ttl,
  },
};
