import * as consts from "../../schema/FAKE";

export function load({ id }) {
  if (id.startsWith("default_forsider_") || id.startsWith("moreinfo_")) {
    return {
      pid: id,
      materialTypes: [{ specific: "bog" }],
      titles: { main: [`${id}__title`] },
    };
  }

  if (id.startsWith("vroevl")) {
    return null;
  }
  if (id.startsWith("work-of:vroevl")) {
    return null;
  }

  if (
    id.startsWith(
      "test_catalogueCodes_nationalBibliography_and_otherCatalogues"
    )
  ) {
    return {
      pid: "test_catalogueCodes_nationalBibliography_and_otherCatalogues",
      catalogueCodes: {
        nationalBibliography: [
          "national_bibliography",
          "more_national_bibliography",
        ],
        otherCatalogues: ["other_catalogues", "more_other_catalogues"],
      },
    };
  }

  if (
    id.startsWith(
      "test_catalogueCodes_yes_nationalBibliography_no_otherCatalogues"
    )
  ) {
    return {
      pid: "test_catalogueCodes_yes_nationalBibliography_no_otherCatalogues",
      catalogueCodes: {
        nationalBibliography: ["national_bibliography"],
        otherCatalogues: [],
      },
    };
  }

  if (
    id.startsWith(
      "test_catalogueCodes_no_nationalBibliography_yes_otherCatalogues"
    )
  ) {
    return {
      pid: "test_catalogueCodes_no_nationalBibliography_yes_otherCatalogues",
      catalogueCodes: {
        nationalBibliography: [],
        otherCatalogues: ["other_catalogues"],
      },
    };
  }

  if (
    id.startsWith(
      "test_catalogueCodes_no_nationalBibliography_no_otherCatalogues"
    )
  ) {
    return {
      pid: "test_catalogueCodes_no_nationalBibliography_no_otherCatalogues",
      catalogueCodes: {
        nationalBibliography: [],
        otherCatalogues: [],
      },
    };
  }

  if (id.startsWith("work-of")) {
    return { ...consts.FAKE_WORK, workId: id };
  } else {
    return (
      {
        "870971-anmeld:37860409": {
          ...consts.FAKE_MANIFESTATION_1,
          pid: id,
          workId: `work-of:${id}`,
          access: {
            accessUrls: [],
            dbcWebArchive: false,
            digitalArticleService: { issn: "issn-not-in-article-service" },
            ereol: [],
            infomediaService: null,
            interLibraryLoanIsPossible: false,
            openUrl: null,
          },
        },
      }[id] || {
        ...consts.FAKE_MANIFESTATION_1,
        pid: id,
        workId: `work-of:${id}`,
      }
    );
  }
}
