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
