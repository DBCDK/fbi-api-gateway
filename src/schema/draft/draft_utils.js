import * as consts from "./FAKE";
import { getArray, resolveManifestation } from "../../utils/utils";
import translations from "../../utils/translations.json";

/**
 * convert workdata from workservice e.g:
 * http://work-presentation-service.cisterne.svc.cloud.dbc.dk/api/work-presentation?agencyId=190101&profile=default&workId=work-of:870970-basis:38499386
 * to jed data structure
 * @param originalData
 * @returns {{}}
 */
export function workToJed(
  originalData,
  manifestation,
  allManifestations = [],
  language = "da"
) {
  const jedData = {};

  jedData.workId = originalData?.work.workId;
  jedData.abstract = [originalData?.work.description];

  jedData.titles = workToJedParseTitle(originalData?.work);
  jedData.creators = workToJedCreators(originalData?.work);

  jedData.materialTypes = workToMaterialTypes(originalData?.work);

  jedData.subjects = workToSubjects(originalData?.work);
  jedData.genreAndForm = workToGenreAndForm(originalData?.work);

  jedData.workTypes = workToWorkTypes(originalData?.work);
  jedData.workYear = manifestationToWorkYear(manifestation);

  jedData.mainLanguages = manifestationToMainLanguages(manifestation, language);
  jedData.relations = originalData?.work?.relations;

  jedData.manifestations = {
    all: allManifestations,
    first: firstManifestation(allManifestations),
    latest: firstManifestation(allManifestations, false),
  };

  return jedData;
}

function firstManifestation(allManifestations, asc = true) {
  const newarrary = [...allManifestations];
  // sort asc
  if (asc) {
    newarrary?.sort((a, b) => a.publicationYear.year - b.publicationYear.year);
  } else {
    newarrary?.sort((a, b) => b.publicationYear.year - a.publicationYear.year);
  }
  return newarrary[0] || [];
}

function manifestationToMainLanguages(manifestation, language) {
  const fisk = getArray(manifestation, "details.iso639-2");
  const mainLanguages = getArray(manifestation, "details.iso639-2")
    .filter((entry) => translations.facets.language[entry.$])
    .map((entry) => {
      return {
        isoCode: entry.$,
        display:
          translations.facets.language[entry.$]?.[language] ||
          translations.facets.language[entry.$]?.["da"],
      };
    });

  return mainLanguages || [];
}

function manifestationToWorkYear(manifestation) {
  // keep only digits, and check that resulting string is four digits
  const workYear = getArray(manifestation, "details.originals.value")
    .map((entry) => entry.$?.replace?.(/\D/g, ""))
    .find((year) => year.length === 4);
  return workYear;
}

function workToWorkTypes(work) {
  const possibleWorkTypes = [
    "ANALYSIS",
    "ARTICLE",
    "BOOKDESCRIPTION",
    "GAME",
    "LITERATURE",
    "MAP",
    "MOVIE",
    "MUSIC",
    "OTHER",
    "PERIODICA",
    "PORTRAIT",
    "REVIEW",
    "SHEETMUSIC",
    "TRACK",
  ];
  return (
    work?.workTypes?.map((type) => {
      const upperCased = type.toUpperCase();
      return possibleWorkTypes.includes(upperCased) ? upperCased : "OTHER";
    }) || []
  );
}

function workToGenreAndForm(work) {
  const include = ["DBCO"];
  return (
    (work?.subjects &&
      work?.subjects
        .filter((subject) => include.includes(subject.type))
        .map((subject) => subject.value)) ||
    []
  );
}

function workToSubjects(work) {
  // We will map all subjects to the generic jed type 'TOPIC'

  // For the dbcVerified we only include the types we use in
  // betabib.
  const include = ["DBCS", "DBCF", "DBCM", null];
  const dbcVerified = work?.subjects
    ?.filter((subject) => include.includes(subject.type))
    .map((subject) => ({
      type: "TOPIC",
      display: subject.value,
      __typename: "SubjectText",
    }));

  const all = work?.subjects?.map((subject) => ({
    type: "TOPIC",
    display: subject.value,
    __typename: "SubjectText",
  }));

  return { all, dbcVerified };
}

function workToMaterialTypes(work) {
  // run through groups to get materialtypes.
  // filter out duplicates
  const jedData = work.groups
    ?.map((group) => {
      return {
        ...consts.FAKE_MATERIALTYPE,
        ...{ specific: group.records[0].types[0] },
      };
    })
    .filter((rec, index, self) => {
      return (
        self.indexOf(
          self.find((record) => record.specific === rec.specific)
        ) === index
      );
    });
  return jedData;
}

function workToJedParseTitle(work) {
  return {
    ...consts.FAKE_WORKTITLES,
    ...{
      main: [work.title],
      full: [work.fullTitle],
    },
  };
}

function workToJedCreators(work) {
  const jedData = work.creators.map((creator) => {
    return {
      ...consts.FAKE_PERSON,
      ...{
        display: creator.value,
        nameSort: creator.value,
        roles: [
          {
            ...consts.FAKE_ROLE,
            ...{ functionCode: creator.type },
            ...{
              function: {
                ...consts.FAKE_TRANSLATION,
                ...{
                  plural: "fiskene",
                  singular: "fisk",
                },
              },
            },
          },
        ],
      },
    };
  });
  return jedData;
}
