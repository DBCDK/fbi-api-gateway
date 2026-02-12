import { performTestQuery } from "../utils/utils";
import { createMockedDataLoaders } from "../datasourceLoader";

const query = `
  mutation ($id: String! $dryRun: Boolean) {
    rawrepo {
      updateOveCode(bibliographicRecordId: $id, dryRun: $dryRun) {
        status
        message
      }
    }
  }  
`;

test("Denies update when agency lacks permissions", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      id: "12345678",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {
        agencyId: "790900",
      },
    },
  });

  expect(result?.data?.rawrepo?.updateOveCode).toEqual({
    status: "FORBIDDEN",
    message: "Agency does not have permission to update OVE codes.",
  });
});

test("Fails when bibliographicRecordId is missing", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      id: "",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {
        agencyId: "715100",
      },
    },
  });

  expect(result?.data?.rawrepo?.updateOveCode).toEqual({
    status: "FAILED",
    message: "Missing BibliographicRecordId.",
  });
});

test("Fails when bibliographicRecordId does not exist", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      id: "1234",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {
        agencyId: "715100",
      },
    },
  });

  expect(result?.data?.rawrepo?.updateOveCode).toEqual({
    status: "FAILED",
    message: `Record 1234 doesn't exist`,
  });
});

test("Succeeds when agency is authorized and bibliographicRecordId is known", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      id: "12345678",
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {
        agencyId: "715100",
      },
    },
  });

  expect(result?.data?.rawrepo?.updateOveCode).toEqual({
    status: "OK",
    message: `Ovecode was successfully updated.`,
  });
});

test("Succeeds in dryRun mode with valid agency and bibliographicRecordId", async () => {
  const result = await performTestQuery({
    query,
    variables: {
      id: "12345678",
      dryRun: true,
    },
    context: {
      datasources: createMockedDataLoaders(),
      accessToken: "DUMMY_TOKEN",
      smaug: {
        agencyId: "715100",
      },
    },
  });

  expect(result?.data?.rawrepo?.updateOveCode).toEqual({
    status: "OK",
    message: `Dry run mode - no changes made.`,
  });
});

test("Succeeds for FBSTest agency regardless of dryRun", async () => {
  jest.resetModules();
  jest.doMock("../config", () => {
    const actual = jest.requireActual("../config").default;
    return {
      __esModule: true,
      default: {
        ...actual,
        lockedAgencyIds: {
          ...actual.lockedAgencyIds,
          list: ["877000"],
        },
      },
    };
  });

  let result;
  jest.isolateModules(() => {
    const { performTestQuery: performTestQueryWithMock } = require("../utils/utils");
    const {
      createMockedDataLoaders: createMockedDataLoadersWithMock,
    } = require("../datasourceLoader");

    result = performTestQueryWithMock({
      query,
      variables: {
        id: "12345678",
      },
      context: {
        datasources: createMockedDataLoadersWithMock(),
        accessToken: "DUMMY_TOKEN",
        smaug: {
          agencyId: "877000",
        },
      },
    });
  });

  result = await result;

  expect(result?.data?.rawrepo?.updateOveCode).toEqual({
    status: "OK",
    message: "FBSTest mode - no changes made.",
  });
  jest.dontMock("../config");
});
