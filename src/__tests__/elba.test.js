import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

const query = `
mutation ($input: CopyRequestInput!) {
    elba {
      placeCopyRequest(input: $input, dryRun: false) {
        status
      }
    }
  }   
`;

test("PeriodicaArticleOrder, unauthenticated token, should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "ANONYMOUS_TOKEN",
      user: null,
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, municiapalityAgencyId not subscribed, should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN_UNSUBSCRIPED_MUNICIPALITY",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "100200",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, no municiapalityAgencyId, should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN_NO_MUNICIPALITY",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: null,
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, manifestation not part of statsbibliotek journal should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-anmeld:37860409",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, missing mail on user and input, should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN_NO_MAIL",
      user: {
        userId: "some-id-without-mail",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, missing mail in user, but given in input, order success", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
        userMail: "user@mail.dk",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN_NO_MAIL",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, userName and userMail set in input, order success", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
        userName: "Navn Navnesen",
        userMail: "user@mail.dk",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, order success", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, originRequester missing from smaug configuration", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      user: {
        userId: "some-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {},
    },
  });

  expect(result).toMatchSnapshot();
});

test("PeriodicaArticleOrder, user blocked by municipality - should give error", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      input: {
        pid: "870971-avis:34591016",
      },
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN_BLOCKED",
      user: {
        userId: "some-blocked-id",
        loggedInAgencyId: "715100",
        municipalityAgencyId: "715100",
      },
      smaug: {
        digitalArticleService: { originRequester: "bibdk" },
      },
    },
  });

  expect(result).toMatchSnapshot();
});
