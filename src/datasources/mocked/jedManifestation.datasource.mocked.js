import * as consts from "../../schema/draft/FAKE";

export function load({ pid }) {
  return (
    {
      "870971-anmeld:37860409": {
        data: {
          manifestation: {
            ...consts.FAKE_MANIFESTATION_1,
            pid,
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
        },
      },
    }[pid] || {
      data: { manifestation: { ...consts.FAKE_MANIFESTATION_1, pid } },
    }
  );
}
