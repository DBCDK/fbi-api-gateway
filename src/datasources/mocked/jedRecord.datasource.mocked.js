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

  if (id === "test_publicationStatus_periodical") {
    return {
      pid: id,
      publicationStatus: {
        display: "Videnskabelig",
        code: "SCIENTIFIC",
      },
    };
  }

  if (id === "test_publicationStatus_other") {
    return {
      pid: id,
      publicationStatus: {
        display: "Faglig",
        code: "PROFESSIONAL",
      },
    };
  }

  if (id === "test_publicationStatus_article") {
    return {
      pid: id,
      hostPublication: {
        publicationStatus: {
          display: "Videnskabelig",
          code: "SCIENTIFIC",
        },
      },
    };
  }

  if (id === "test_periodicalTitleHistory") {
    return {
      pid: id,
      periodicalTitleHistory: [
        {
          heading: "Også på internettet",
          title: ["Balder"],
          issn: "1903-2625",
          urls: [{ url: "https://example.com/balder" }],
        },
      ],
    };
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
