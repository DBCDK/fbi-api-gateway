import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("library - get branches for agency", async () => {
  const result = await performTestQuery({
    query: `
          query{
            branches(agencyid: "710100", sortPickupAllowed: true){
              hitcount
              result {
                borrowerCheck
                agencyId
                branchId
                name
                openingHours
                userParameters {
                  userParameterType
                  parameterRequired
                }
                postalAddress
                postalCode
                city
                pickupAllowed
                digitalCopyAccess
              }
            }
          }
        `,
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("library - get all", async () => {
  const result = await performTestQuery({
    query: `
        query{
            branches(sortPickupAllowed: true){
              hitcount
              result {
                borrowerCheck
                agencyName
                agencyId
                branchId
                name
                openingHours
                userParameters {
                  userParameterType
                  parameterRequired
                }
                postalAddress
                postalCode
                city
                pickupAllowed
                digitalCopyAccess
              }
            }
          }
        `,
    variables: { bibdkExcludeBranches: true },
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});

test("library - ISIL search is equivalent to library number search", async () => {
  const query = `
        query ($q: String) {
          branches(q: $q, limit: 5) {
            hitcount
            result {
              branchId
              name
            }
          }
        }
      `;

  const search = async (q) =>
    (
      await performTestQuery({
        query,
        variables: { q },
        context: { datasources: createMockedDataLoaders() },
      })
    ).data.branches;

  const plain = await search("721900");
  expect(plain.result[0].branchId).toBe("721900");

  // The ISIL forms must give the exact same result as the library number
  expect(await search("DK-721900")).toEqual(plain);
  expect(await search("dk-721900")).toEqual(plain);
  expect(await search("DK721900")).toEqual(plain);
  expect(await search(" DK-721900 ")).toEqual(plain);

  // A library actually named with a "DK-" prefix is still found by name,
  // ie. the prefix is only stripped from a query that is entirely an ISIL
  const named = await search("DK-5-basen");
  expect(named.result.map((branch) => branch.name)).toContain("DK-5-basen");
});
