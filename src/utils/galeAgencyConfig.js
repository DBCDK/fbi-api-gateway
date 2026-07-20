const FULL_ACCESS = [
  "150023-glicon",
  "150023-biocon",
  "150023-stucon",
  "150023-sicref",
  "150023-litres",
];

const STUCON_AND_SICREF_ACCESS = ["150023-stucon", "150023-sicref"];
const SICREF_AND_LITRES_ACCESS = ["150023-sicref", "150023-litres"];
const SICREF_ONLY_ACCESS = ["150023-sicref"];
const STUCON_ONLY_ACCESS = ["150023-stucon"];
const LITRES_ONLY_ACCESS = ["150023-litres"];
const NO_ACCESS_RESTRICTIONS = [];

export const GALE_AGENCY_CONFIG = {
  758000: {
    providersLibraryId: "abenra",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  785100: {
    providersLibraryId: "45aalborgland",
    accessTo: FULL_ACCESS,
  },
  775100: {
    providersLibraryId: "aarkomm",
    accessTo: FULL_ACCESS,
  },
  720100: { providersLibraryId: "allerodb", accessTo: NO_ACCESS_RESTRICTIONS },
  742000: {
    providersLibraryId: "assens",
    accessTo: SICREF_ONLY_ACCESS,
  },
  715100: {
    providersLibraryId: "ballerup",
    accessTo: FULL_ACCESS,
  },
  753000: {
    providersLibraryId: "grindsted",
    accessTo: FULL_ACCESS,
  },
  781000: {
    providersLibraryId: "bronderslev",
    accessTo: STUCON_ONLY_ACCESS,
  },
  724000: {
    providersLibraryId: "egedal",
    accessTo: SICREF_ONLY_ACCESS,
  },
  756100: {
    providersLibraryId: "45esbjer",
    accessTo: SICREF_AND_LITRES_ACCESS,
  },
  743000: {
    providersLibraryId: "faaborg",
    accessTo: SICREF_ONLY_ACCESS,
  },
  771000: {
    providersLibraryId: "favrskov",
    accessTo: SICREF_ONLY_ACCESS,
  },
  732000: { providersLibraryId: "haslev", accessTo: NO_ACCESS_RESTRICTIONS },
  760700: {
    providersLibraryId: "fredericia",
    accessTo: SICREF_ONLY_ACCESS,
  },
  714700: {
    providersLibraryId: "fkb",
    accessTo: FULL_ACCESS,
  },
  781300: {
    providersLibraryId: "frederikshavn",
    accessTo: NO_ACCESS_RESTRICTIONS,
  },
  719000: {
    providersLibraryId: "vaerlose",
    accessTo: SICREF_ONLY_ACCESS,
  },
  715700: {
    providersLibraryId: "45gentko",
    accessTo: STUCON_ONLY_ACCESS,
  },
  715900: {
    providersLibraryId: "gladsaxe",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  737600: {
    providersLibraryId: "45nykob",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  721700: {
    providersLibraryId: "helsingor",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  716300: {
    providersLibraryId: "herlev",
    accessTo: SICREF_ONLY_ACCESS,
  },
  765700: {
    providersLibraryId: "45hernin",
    accessTo: FULL_ACCESS,
  },
  716900: {
    providersLibraryId: "taastrup",
    accessTo: FULL_ACCESS,
  },
  766100: {
    providersLibraryId: "holstebro",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  716700: {
    providersLibraryId: "hvidovre",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  775600: { providersLibraryId: "ikast", accessTo: NO_ACCESS_RESTRICTIONS },
  732600: {
    providersLibraryId: "kalundborg",
    accessTo: SICREF_AND_LITRES_ACCESS,
  },
  710100: {
    providersLibraryId: "45kobenh",
    accessTo: FULL_ACCESS,
  },
  725900: {
    providersLibraryId: "koge",
    accessTo: SICREF_ONLY_ACCESS,
  },
  762100: {
    providersLibraryId: "kolding",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  717300: {
    providersLibraryId: "lyngby",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  741000: {
    providersLibraryId: "middelfartclc",
    accessTo: FULL_ACCESS,
  },
  746100: {
    providersLibraryId: "45odense",
    accessTo: FULL_ACCESS,
  },
  773000: {
    providersLibraryId: "randers",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  717500: {
    providersLibraryId: "rodovre",
    accessTo: STUCON_ONLY_ACCESS,
  },
  723000: { providersLibraryId: "sollerod", accessTo: NO_ACCESS_RESTRICTIONS },
  774000: {
    providersLibraryId: "silkeborg",
    accessTo: FULL_ACCESS,
  },
  726900: {
    providersLibraryId: "solrod",
    accessTo: STUCON_ONLY_ACCESS,
  },
  754000: {
    providersLibraryId: "sonder",
    accessTo: SICREF_ONLY_ACCESS,
  },
  747900: {
    providersLibraryId: "svendborg",
    accessTo: FULL_ACCESS,
  },
  718500: {
    providersLibraryId: "taarnby",
    accessTo: FULL_ACCESS,
  },
  755000: {
    providersLibraryId: "toender",
    accessTo: SICREF_ONLY_ACCESS,
  },
  757300: {
    providersLibraryId: "vardeclc",
    accessTo: LITRES_ONLY_ACCESS,
  },
  763000: {
    providersLibraryId: "vejle",
    accessTo: STUCON_ONLY_ACCESS,
  },
  779100: {
    providersLibraryId: "viborg",
    accessTo: STUCON_AND_SICREF_ACCESS,
  },
  739000: {
    providersLibraryId: "vording",
    accessTo: FULL_ACCESS,
  },
  778700: {
    providersLibraryId: "",
    accessTo: FULL_ACCESS,
  },
};

export function getGaleAgencyConfig(agencyId) {
  if (!agencyId) {
    return null;
  }

  return GALE_AGENCY_CONFIG[agencyId] ?? null;
}
