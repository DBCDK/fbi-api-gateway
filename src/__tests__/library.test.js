import { createMockedDataLoaders } from "../datasourceLoader";
import { performTestQuery } from "../utils/utils";

test("library - get branches for agency", async () => {
  const result = await performTestQuery({
    query: `
          query{
            branches(agencyid: "710100"){
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
            branches{
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
    variables: {},
    context: { datasources: createMockedDataLoaders() },
  });
  expect(result).toMatchSnapshot();
});
