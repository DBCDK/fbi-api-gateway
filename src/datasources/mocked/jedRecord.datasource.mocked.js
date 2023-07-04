import * as consts from "../../schema/draft/FAKE";

export function load({ id }) {
  if (id.startsWith("vroevl")) {
    return null;
  }
  if (id.startsWith("work-of:vroevl")) {
    return null;
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
